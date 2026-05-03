import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  image: z.string().max(1000).optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(100),
  selectedColor: z.string().max(50).optional(),
  selectedSize: z.string().max(50).optional(),
});

const createOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(20).regex(/^[+0-9\s-]+$/),
  governorate: z.string().trim().min(2).max(50),
  address: z.string().trim().min(3).max(500),
  notes: z.string().max(1000).optional(),
  items: z.array(itemSchema).min(1).max(50),
  coupon_code: z.string().max(50).optional(),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const userAgent = getRequestHeader("user-agent") ?? "";

    // Rate limit: max 5 orders per IP per 10 minutes
    const { data: rl } = await supabaseAdmin
      .from("order_rate_limits")
      .select("*")
      .eq("ip_address", ip)
      .maybeSingle();

    const now = new Date();
    if (rl) {
      const windowAge = (now.getTime() - new Date(rl.window_start).getTime()) / 1000 / 60;
      if (windowAge < 10 && rl.request_count >= 5) {
        throw new Error("Too many orders from this IP. Please wait a few minutes.");
      }
      if (windowAge < 10) {
        await supabaseAdmin
          .from("order_rate_limits")
          .update({ request_count: rl.request_count + 1 })
          .eq("ip_address", ip);
      } else {
        await supabaseAdmin
          .from("order_rate_limits")
          .update({ request_count: 1, window_start: now.toISOString() })
          .eq("ip_address", ip);
      }
    } else {
      await supabaseAdmin.from("order_rate_limits").insert({ ip_address: ip });
    }

    // Verify products & prices server-side
    const productIds = data.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name_ar, price, stock, is_active, images")
      .in("id", productIds);
    if (prodErr) throw new Error(prodErr.message);

    let total = 0;
    const verifiedItems = data.items.map((item) => {
      const p = products?.find((x) => x.id === item.productId);
      if (!p || !p.is_active) throw new Error(`Product unavailable: ${item.name}`);
      if (p.stock < item.quantity) throw new Error(`Insufficient stock for ${p.name_ar}`);
      const price = Number(p.price);
      total += price * item.quantity;
      const imgs = (p.images as string[] | null) ?? [];
      return {
        product_id: p.id,
        product_name: p.name_ar,
        product_image: item.image ?? imgs[0] ?? null,
        quantity: item.quantity,
        price,
        selected_color: item.selectedColor ?? null,
        selected_size: item.selectedSize ?? null,
        subtotal: price * item.quantity,
      };
    });

    // Shipping
    const { data: rate } = await supabaseAdmin
      .from("shipping_rates")
      .select("price")
      .eq("governorate", data.governorate)
      .maybeSingle();
    const shipping = rate ? Number(rate.price) : 60;

    // Coupon
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (data.coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", data.coupon_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
        const underLimit = !coupon.usage_limit || coupon.used_count < coupon.usage_limit;
        const meetsMin = total >= Number(coupon.min_order_amount);
        if (notExpired && underLimit && meetsMin) {
          if (coupon.discount_type === "percentage") {
            discount = (total * Number(coupon.discount_value)) / 100;
            if (coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
          } else {
            discount = Number(coupon.discount_value);
          }
          appliedCoupon = coupon.code;
          await supabaseAdmin
            .from("coupons")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    const finalPrice = Math.max(0, total + shipping - discount);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        governorate: data.governorate,
        address: data.address,
        notes: data.notes ?? null,
        total_price: total,
        shipping_price: shipping,
        discount,
        coupon_code: appliedCoupon,
        final_price: finalPrice,
        status: "pending",
        ip_address: ip,
        user_agent: userAgent.substring(0, 500),
      })
      .select()
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Failed to create order");

    const itemsToInsert = verifiedItems.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemsToInsert);
    if (itemsErr) throw new Error(itemsErr.message);

    // Decrement stock
    for (const it of verifiedItems) {
      const p = products!.find((x) => x.id === it.product_id)!;
      await supabaseAdmin
        .from("products")
        .update({ stock: p.stock - it.quantity, sales_count: (p as any).sales_count ? undefined : undefined })
        .eq("id", it.product_id);
    }

    return {
      id: order.id,
      order_number: order.order_number,
      final_price: finalPrice,
      shipping,
      discount,
      total,
    };
  });

const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => validateCouponSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!coupon) return { valid: false, message: "Invalid code" };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { valid: false, message: "Expired" };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
      return { valid: false, message: "Limit reached" };
    if (data.subtotal < Number(coupon.min_order_amount))
      return { valid: false, message: `Min order ${coupon.min_order_amount}` };

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (data.subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
    } else {
      discount = Number(coupon.discount_value);
    }
    return { valid: true, discount, code: coupon.code };
  });
