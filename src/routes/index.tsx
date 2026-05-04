import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";
import royalLogo from "@/assets/royal-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async () => {
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(20),
      supabase.from("banners").select("*").eq("is_active", true).eq("position", "hero").order("sort_order"),
    ]);
    return { products: (p ?? []) as Tables<"products">[], banners: (b ?? []) as Tables<"banners">[] };
  },
  staleTime: 0,
  errorComponent: ({ error }) => <div className="container mx-auto p-8 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="container mx-auto p-8 text-center">Not found</div>,
  head: () => ({
    meta: [
      { title: "Royal — متجر الأجهزة المنزلية الفاخر" },
      { name: "description", content: "اكتشف أحدث الأجهزة المنزلية والإلكترونيات الصغيرة بأفضل الأسعار. توصيل سريع ودفع عند الاستلام." },
    ],
  }),
});

function HomePage() {
  const { lang } = useApp();
  const { products, banners } = Route.useLoaderData();

  const heroBanner = banners[0];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 -start-10 w-72 h-72 rounded-full bg-gold/30 blur-3xl animate-float" />
          <div className="absolute bottom-10 -end-10 w-96 h-96 rounded-full bg-success/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-start">
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Flame className="w-4 h-4 text-gold" />
                {lang === "ar" ? "خصومات حصرية اليوم فقط" : "Exclusive deals today"}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                {heroBanner ? (lang === "ar" ? heroBanner.title_ar : heroBanner.title_en) : (
                  <>
                    <span className="text-gradient-gold">Royal</span><br />
                    {lang === "ar" ? "الفخامة في كل تفصيلة" : "Luxury in every detail"}
                  </>
                )}
              </h1>
              <p className="text-lg opacity-90 mb-6 max-w-lg mx-auto md:mx-0">
                {heroBanner ? (lang === "ar" ? heroBanner.subtitle_ar : heroBanner.subtitle_en) : t(lang, "tagline")}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link to="/shop" className="btn-3d-gold rounded-xl px-8 py-4 font-bold text-lg inline-flex items-center gap-2">
                  {t(lang, "orderNow")}
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </Link>
                <Link to="/categories" className="glass rounded-xl px-8 py-4 font-bold text-lg hover:bg-white/20 transition-colors">
                  {t(lang, "categories")}
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="aspect-square rounded-3xl bg-gradient-luxury shadow-luxury animate-glow flex items-center justify-center p-8 border border-gold/30">
                <img src={royalLogo} alt="Royal" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductSection title={t(lang, "shop")} products={products} />
    </div>
  );
}

function ProductSection({ title, products }: { title: string; products: Tables<"products">[] }) {
  const { lang } = useApp();
  if (products.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold">{title}</h2>
        <Link to="/shop" className="text-gold font-bold text-sm hover:underline">{t(lang, "viewAll")}</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
