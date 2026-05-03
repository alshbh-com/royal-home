import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { t, formatPrice } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { validateCoupon } from "@/server/orders.functions";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "السلة — Royal" }] }),
});

function CartPage() {
  const { lang, cart, updateQty, removeFromCart, cartTotal } = useApp();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
              className="flex gap-3 md:gap-4 glass-strong rounded-2xl p-3 md:p-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 md:w-28 md:h-28 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-base line-clamp-2">{item.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  {item.selectedColor && <span>• {item.selectedColor}</span>}
                  {item.selectedSize && <span>• {item.selectedSize}</span>}
                </div>
                <div className="text-gold font-extrabold mt-1">{formatPrice(item.price, lang)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-card border border-border rounded-lg">
                    <button onClick={() => updateQty(item.productId, item.selectedColor, item.selectedSize, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.selectedColor, item.selectedSize, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId, item.selectedColor, item.selectedSize)}
                    className="text-destructive p-2 hover:bg-destructive/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="glass-strong rounded-2xl p-5 h-fit lg:sticky lg:top-24 space-y-4">
          <h3 className="font-extrabold text-lg">{t(lang, "total")}</h3>

          {/* Coupon */}
          <div className="flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder={t(lang, "coupon")}
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border outline-none focus:border-gold text-sm" />
            <button onClick={apply} disabled={validating}
              className="px-4 py-2 bg-gradient-gold text-gold-foreground rounded-lg font-bold text-sm flex items-center gap-1 disabled:opacity-50">
              <Tag className="w-4 h-4" /> {t(lang, "apply")}
            </button>
          </div>
          {appliedCode && <div className="text-xs font-bold text-success">✓ {appliedCode} — {formatPrice(discount, lang)}</div>}

          <div className="space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span>{t(lang, "subtotal")}</span><span className="font-bold">{formatPrice(cartTotal, lang)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>{t(lang, "discount")}</span><span className="font-bold">- {formatPrice(discount, lang)}</span></div>}
            <div className="flex justify-between text-muted-foreground text-xs"><span>{t(lang, "shipping")}</span><span>{lang === "ar" ? "يحسب عند الإتمام" : "Calculated at checkout"}</span></div>
          </div>

          <div className="flex justify-between text-xl font-extrabold border-t border-border pt-4">
            <span>{t(lang, "total")}</span>
            <span className="text-gold">{formatPrice(total, lang)}</span>
          </div>

          <button onClick={() => navigate({ to: "/checkout", search: { coupon: appliedCode ?? undefined } })}
            className="w-full btn-3d-gold rounded-xl py-4 text-lg">
            {t(lang, "checkout")}
          </button>
        </aside>
      </div>
    </div>
  );
}
