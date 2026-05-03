import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import type { Tables } from "@/integrations/supabase/types";

const searchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).optional(),
  available: z.boolean().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ShopPage,
  head: () => ({ meta: [{ title: "المتجر — Royal" }, { name: "description", content: "تسوق كل منتجات Royal" }] }),
});

function ShopPage() {
  const { lang } = useApp();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState(5000);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("products").select("*").eq("is_active", true);
      if (search.category) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", search.category).maybeSingle();
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search.available) q = q.gt("stock", 0);
      switch (search.sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "rating": q = q.order("rating", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      const [{ data: p }, { data: c }] = await Promise.all([
        q.limit(60),
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setProducts(p ?? []);
      setCategories(c ?? []);
      setLoading(false);
    })();
  }, [search.category, search.sort, search.available]);

  const filtered = useMemo(
    () => products.filter((p) => Number(p.price) <= priceMax && p.rating >= minRating),
    [products, priceMax, minRating]
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6">{t(lang, "shop")}</h1>

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden glass px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" /> {t(lang, "filterBy")}
        </button>
        <select
          value={search.category ?? ""}
          onChange={(e) => navigate({ search: { ...search, category: e.target.value || undefined } })}
          className="px-3 py-2 bg-card border border-border rounded-xl font-semibold text-sm"
        >
          <option value="">{t(lang, "categories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{lang === "ar" ? c.name_ar : c.name_en}</option>
          ))}
        </select>
        <select
          value={search.sort ?? "newest"}
          onChange={(e) => navigate({ search: { ...search, sort: e.target.value as any } })}
          className="px-3 py-2 bg-card border border-border rounded-xl font-semibold text-sm"
        >
          <option value="newest">{t(lang, "sortNewest")}</option>
          <option value="price-asc">{t(lang, "sortPriceLow")}</option>
          <option value="price-desc">{t(lang, "sortPriceHigh")}</option>
          <option value="rating">{t(lang, "sortRating")}</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={!!search.available}
            onChange={(e) => navigate({ search: { ...search, available: e.target.checked || undefined } })}
            className="w-4 h-4 accent-gold"
          />
          {t(lang, "available")}
        </label>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className={`${showFilters ? "block" : "hidden"} md:block space-y-6 glass-strong rounded-2xl p-5 h-fit md:sticky md:top-24`}>
          <div>
            <h3 className="font-bold mb-3">{t(lang, "priceRange")} (max)</h3>
            <input
              type="range" min={100} max={10000} step={100} value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="text-sm font-semibold text-gold mt-1">{priceMax} {t(lang, "egp")}</div>
          </div>
          <div>
            <h3 className="font-bold mb-3">{t(lang, "rating")}</h3>
            {[0, 3, 4, 4.5].map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-gold" />
                <span className="text-sm">{r === 0 ? (lang === "ar" ? "الكل" : "All") : `${r}+ ⭐`}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {lang === "ar" ? "لا توجد منتجات" : "No products found"}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
