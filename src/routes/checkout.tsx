import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Truck, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t, formatPrice } from "@/lib/i18n";
import { createOrder, validateCoupon } from "@/server/orders.functions";
import { track } from "@/lib/analytics";
import type { Tables } from "@/integrations/supabase/types";

const searchSchema = z.object({ coupon: z.string().optional() });

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => searchSchema.parse(s),
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "إتمام الطلب — Royal" }] }),
});

function CheckoutPage() {
  const { lang, cart, cartTotal, clearCart } = useApp();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [rates, setRates] = useState<Tables<"shipping_rates">[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({ customer_name: "", phone: "", governorate: "", address: "", notes: "" });

  useEffect(() => {
    if (cart.length === 0) navigate({ to: "/cart" });
    else track("begin_checkout", { metadata: { items: cart.length, total: cartTotal } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from("shipping_rates").select("*").eq("is_active", true).order("governorate");
      setRates(r ?? []);
      if (search.coupon) {
        const v = await validateCoupon({ data: { code: search.coupon, subtotal: cartTotal } });
        if (v.valid) setDiscount(v.discount ?? 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const govRate = rates.find((r) => r.governorate === form.governorate);
  const shipping = govRate ? Number(govRate.price) : 0;
  const total = Math.max(0, cartTotal + shipping - discount);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone || !form.governorate || !form.address) {
      toast.error(t(lang, "requiredField")); return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        data: {
          ...form,
          coupon_code: search.coupon,
          items: cart.map((c) => ({
            productId: c.productId, name: c.name, image: c.image,
            price: c.price, quantity: c.quantity,
            selectedColor: c.selectedColor, selectedSize: c.selectedSize,
          })),
        },
      });
      clearCart();
      navigate({ to: "/order-success/$orderNumber", params: { orderNumber: result.order_number } });
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6">{t(lang, "checkout")}</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="glass-strong rounded-2xl p-5 md:p-6 space-y-4">
          <h3 className="font-extrabold text-lg">{t(lang, "customerInfo")}</h3>

          <div>
            <label className="block text-sm font-bold mb-1">{t(lang, "fullName")} *</label>
            <input required minLength={2} maxLength={100} value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">{t(lang, "phone")} *</label>
            <input required type="tel" pattern="[+0-9\s-]+" minLength={6} maxLength={20} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01xxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">{t(lang, "governorate")} *</label>
            <select required value={form.governorate}
              onChange={(e) => setForm({ ...form, governorate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none">
              <option value="">{t(lang, "selectGovernorate")}</option>
              {rates.map((r) => <option key={r.id} value={r.governorate}>{r.governorate} ({formatPrice(Number(r.price), lang)} - {r.delivery_days})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">{t(lang, "address")} *</label>
            <textarea required minLength={3} maxLength={500} rows={2} value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">{t(lang, "notes")}</label>
            <textarea rows={2} maxLength={1000} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>

          {/* Payment */}
          <div className="border-t border-border pt-4">
            <h3 className="font-extrabold text-lg mb-3">{lang === "ar" ? "طريقة الدفع" : "Payment"}</h3>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gold bg-gold/5">
              <Banknote className="w-6 h-6 text-gold" />
              <div>
                <div className="font-bold">{t(lang, "cashOnDelivery")}</div>
                <div className="text-xs text-muted-foreground">{lang === "ar" ? "ادفع نقداً عند استلام طلبك" : "Pay cash on delivery"}</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="glass-strong rounded-2xl p-5 h-fit lg:sticky lg:top-24 space-y-4">
          <h3 className="font-extrabold text-lg">{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((it) => (
              <div key={`${it.productId}-${it.selectedColor}-${it.selectedSize}`} className="flex gap-2 text-sm">
                <img src={it.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.quantity} × {formatPrice(it.price, lang)}</div>
                </div>
                <div className="font-bold whitespace-nowrap">{formatPrice(it.price * it.quantity, lang)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span>{t(lang, "subtotal")}</span><span className="font-bold">{formatPrice(cartTotal, lang)}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {t(lang, "shipping")}</span><span className="font-bold">{shipping === 0 && form.governorate ? (lang === "ar" ? "مجاني" : "Free") : formatPrice(shipping, lang)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>{t(lang, "discount")}</span><span className="font-bold">- {formatPrice(discount, lang)}</span></div>}
          </div>

          <div className="flex justify-between text-xl font-extrabold border-t border-border pt-4">
            <span>{t(lang, "total")}</span>
            <span className="text-gold">{formatPrice(total, lang)}</span>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full btn-3d-gold rounded-xl py-4 text-lg disabled:opacity-50">
            {submitting ? "..." : t(lang, "confirmOrder")}
          </button>
        </aside>
      </form>
    </div>
  );
}
