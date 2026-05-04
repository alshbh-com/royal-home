import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, ShoppingCart, Zap, Truck, Shield, Minus, Plus, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t, formatPrice } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { createOrder } from "@/serverfn/orders.functions";
import { track } from "@/lib/analytics";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { lang, addToCart } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Tables<"products"> | null>(null);
  const [related, setRelated] = useState<Tables<"products">[]>([]);
  const [shippingRates, setShippingRates] = useState<Tables<"shipping_rates">[]>([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState<string | undefined>();
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);

  // quick order
  const [showQuick, setShowQuick] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", governorate: "", address: "", notes: "" });

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      setProduct(p ?? null);
      setImgIdx(0); setColor(undefined); setSize(undefined); setQty(1);
      if (p) track("product_view", { product_id: p.id });
      if (p?.category_id) {
        const { data: r } = await supabase.from("products").select("*")
          .eq("is_active", true).eq("category_id", p.category_id).neq("id", p.id).limit(4);
        setRelated(r ?? []);
      }
      const { data: s } = await supabase.from("shipping_rates").select("*").eq("is_active", true);
      setShippingRates(s ?? []);
    })();
  }, [slug]);

  if (!product) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  const name = lang === "ar" ? product.name_ar : product.name_en;
  const desc = lang === "ar" ? product.description_ar : product.description_en;
  const images = (product.images as string[] | null) ?? [];
  const img = images[imgIdx] ?? "https://placehold.co/800";
  const colors = (product.colors as string[] | null) ?? [];
  const sizes = (product.sizes as string[] | null) ?? [];
  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const lowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;
  const quantityOffers = (((product as any).quantity_offers as { quantity: number; price: number }[] | null) ?? [])
    .slice().sort((a, b) => a.quantity - b.quantity);
  // Pick the best matching offer for the chosen qty (largest qty <= selected qty).
  const matchedOffer = quantityOffers.filter((o) => qty >= o.quantity).pop();
  const unitPrice = matchedOffer ? matchedOffer.price / matchedOffer.quantity : Number(product.price);
  const lineTotal = matchedOffer && qty === matchedOffer.quantity ? matchedOffer.price : unitPrice * qty;

  const validate = (): boolean => {
    if (colors.length > 0 && !color) { toast.error(t(lang, "pleaseSelectColor")); return false; }
    if (sizes.length > 0 && !size) { toast.error(t(lang, "pleaseSelectSize")); return false; }
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;
    addToCart({
      productId: product.id, name, image: img, price: unitPrice,
      quantity: qty, selectedColor: color, selectedSize: size, stock: product.stock,
    });
    track("add_to_cart", { product_id: product.id, metadata: { qty } });
    toast.success(t(lang, "addedToCart"));
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    // Open quick order modal — does NOT touch the cart, so the order
    // contains only this product (with the selected color/size/qty).
    setShowQuick(true);
  };

  const submitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!form.customer_name || !form.phone || !form.governorate || !form.address) {
      toast.error(t(lang, "requiredField")); return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        data: {
          ...form,
          items: [{
            productId: product.id, name, image: img, price: Number(product.price),
            quantity: qty, selectedColor: color, selectedSize: size,
          }],
        },
      });
      track("purchase", { product_id: product.id, metadata: { order_number: result.order_number, total: result.final_price } });
      navigate({ to: "/order-success/$orderNumber", params: { orderNumber: result.order_number } });
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div
            className="relative aspect-square rounded-3xl overflow-hidden bg-muted glass-strong cursor-zoom-in"
            onClick={() => setZoom(!zoom)}
          >
            <img src={img} alt={name} className={`w-full h-full object-cover transition-transform duration-300 ${zoom ? "scale-150" : ""}`} />
            {hasDiscount && (
              <div className="absolute top-4 start-4 bg-destructive text-destructive-foreground font-bold px-3 py-1.5 rounded-lg">
                {Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)}% {t(lang, "off")}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${i === imgIdx ? "border-gold" : "border-border"}`}
                >
                  <img src={im} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {product.video_url && (
            <video src={product.video_url} controls className="w-full mt-3 rounded-2xl" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-4xl font-extrabold">{name}</h1>

          {product.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(product.rating) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="font-bold">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviews_count} {t(lang, "reviews")})</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-extrabold text-gold">{formatPrice(Number(product.price), lang)}</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(product.compare_at_price), lang)}</span>
            )}
          </div>

          {product.stock > 0 ? (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${lowStock ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
              <Zap className="w-4 h-4" />
              {lowStock ? t(lang, "fewLeft") : t(lang, "inStock")}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm bg-destructive/10 text-destructive">
              {t(lang, "outOfStock")}
            </div>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <div>
              <div className="font-bold mb-2">{t(lang, "color")}: <span className="text-gold">{color ?? "-"}</span></div>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all ${color === c ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <div>
              <div className="font-bold mb-2">{t(lang, "size")}: <span className="text-gold">{size ?? "-"}</span></div>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`min-w-[3rem] px-4 py-2 rounded-xl border-2 font-semibold transition-all ${size === s ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="flex items-center gap-3">
            <span className="font-bold">{t(lang, "quantity")}:</span>
            <div className="flex items-center glass-strong rounded-xl">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:text-gold">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-10 h-10 flex items-center justify-center hover:text-gold">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={handleAdd} disabled={product.stock === 0}
              className="rounded-xl py-4 font-bold border-2 border-gold text-gold hover:bg-gold hover:text-gold-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <ShoppingCart className="w-5 h-5" /> {t(lang, "addToCart")}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0}
              className="btn-3d-gold rounded-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {t(lang, "buyNow")}
            </button>
          </div>

          <button onClick={() => setShowQuick(!showQuick)}
            disabled={product.stock === 0}
            className="w-full rounded-xl py-3 font-bold bg-gradient-luxury text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 border border-gold/30">
            <Phone className="w-5 h-5" /> {t(lang, "quickOrder")} — {t(lang, "cashOnDelivery")}
          </button>

          {showQuick && (
            <form onSubmit={submitQuick} className="glass-strong rounded-2xl p-5 space-y-3">
              <h3 className="font-extrabold text-lg">{t(lang, "customerInfo")}</h3>
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder={t(lang, "fullName")} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
              <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t(lang, "phone")} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
              <select required value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none">
                <option value="">{t(lang, "selectGovernorate")}</option>
                {shippingRates.map((r) => <option key={r.id} value={r.governorate}>{r.governorate} ({formatPrice(Number(r.price), lang)})</option>)}
              </select>
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t(lang, "address")} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t(lang, "notes")} rows={2} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-gold outline-none" />
              <button type="submit" disabled={submitting} className="w-full btn-3d-gold rounded-xl py-4 disabled:opacity-50">
                {submitting ? "..." : t(lang, "confirmOrder")}
              </button>
            </form>
          )}

          {/* Trust */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm"><Truck className="w-5 h-5 text-gold" /> {lang === "ar" ? "شحن لجميع المحافظات" : "Ship nationwide"}</div>
            <div className="flex items-center gap-2 text-sm"><Shield className="w-5 h-5 text-gold" /> {lang === "ar" ? "ضمان الجودة" : "Quality guarantee"}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      {desc && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-extrabold mb-4">{t(lang, "description")}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{desc}</p>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold mb-6">{t(lang, "relatedProducts")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
