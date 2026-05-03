import { Link, useNavigate } from "@tanstack/react-router";
import { Star, ShoppingCart, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t, formatPrice } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";

type P = Tables<"products">;

export function ProductCard({ product }: { product: P }) {
  const { lang, addToCart } = useApp();
  const name = lang === "ar" ? product.name_ar : product.name_en;
  const images = (product.images as string[] | null) ?? [];
  const img = images[0] ?? "https://placehold.co/600x600?text=Royal";
  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0;
  const lowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-gold/50 transition-all duration-300 hover:shadow-luxury">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="px-2 py-1 bg-success text-success-foreground text-xs font-bold rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {lang === "ar" ? "جديد" : "NEW"}
              </span>
            )}
            {hasDiscount && (
              <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md">
                -{discountPct}%
              </span>
            )}
            {product.is_bestseller && (
              <span className="px-2 py-1 bg-gradient-gold text-gold-foreground text-xs font-bold rounded-md">
                ⭐ {lang === "ar" ? "الأكثر مبيعاً" : "Top"}
              </span>
            )}
          </div>
          {lowStock && (
            <div className="absolute bottom-0 inset-x-0 bg-destructive/90 text-destructive-foreground text-xs font-bold py-1.5 text-center backdrop-blur-sm">
              ⚡ {t(lang, "fewLeft")}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <span className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg font-bold">
                {t(lang, "outOfStock")}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 md:p-4">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="font-bold text-sm md:text-base line-clamp-2 min-h-[2.5rem] hover:text-gold transition-colors">
            {name}
          </h3>
        </Link>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="text-xs font-semibold">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
          </div>
        )}

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-extrabold text-gold">{formatPrice(Number(product.price), lang)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(Number(product.compare_at_price), lang)}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (product.stock === 0) return;
            addToCart({
              productId: product.id,
              name,
              image: img,
              price: Number(product.price),
              quantity: 1,
              stock: product.stock,
            });
          }}
          disabled={product.stock === 0}
          className="mt-3 w-full btn-3d-gold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {t(lang, "addToCart")}
        </button>
      </div>
    </div>
  );
}
