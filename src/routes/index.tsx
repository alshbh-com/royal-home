import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Shield, Headphones, RefreshCw, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Royal — متجر الأجهزة المنزلية الفاخر" },
      { name: "description", content: "اكتشف أحدث الأجهزة المنزلية والإلكترونيات الصغيرة بأفضل الأسعار. توصيل سريع ودفع عند الاستلام." },
    ],
  }),
});

function HomePage() {
  const { lang } = useApp();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [banners, setBanners] = useState<Tables<"banners">[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }, { data: b }] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(20),
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("banners").select("*").eq("is_active", true).eq("position", "hero").order("sort_order"),
      ]);
      setProducts(p ?? []);
      setCategories(c ?? []);
      setBanners(b ?? []);
    })();
  }, []);

  const bestSellers = products.filter((p) => p.is_bestseller).slice(0, 8);
  const newArrivals = products.filter((p) => p.is_new).slice(0, 8);
  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  const heroBanner = banners[0];
  const dealsEndsAt = new Date(Date.now() + 1000 * 60 * 60 * 36); // 36h

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
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
              <div className="aspect-square rounded-3xl bg-gradient-gold shadow-gold animate-glow flex items-center justify-center text-9xl">
                👑
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BAR */}
      <section className="container mx-auto px-4 -mt-6 md:-mt-10 relative z-10">
        <div className="glass-strong rounded-2xl p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-luxury">
          {[
            { icon: Truck, ar: "شحن سريع", en: "Fast Shipping" },
            { icon: Shield, ar: "ضمان الجودة", en: "Quality Guarantee" },
            { icon: RefreshCw, ar: "استرجاع 14 يوم", en: "14-day Return" },
            { icon: Headphones, ar: "دعم 24/7", en: "24/7 Support" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0 shadow-gold">
                <f.icon className="w-6 h-6 text-gold-foreground" />
              </div>
              <span className="font-bold text-sm md:text-base">{lang === "ar" ? f.ar : f.en}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold">{t(lang, "categories")}</h2>
          <Link to="/categories" className="text-gold font-bold text-sm hover:underline">{t(lang, "viewAll")}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="group relative aspect-square rounded-2xl bg-gradient-luxury text-primary-foreground p-4 overflow-hidden hover:shadow-luxury transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 border border-gold/20"
            >
              <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">
                {c.slug === "kitchen" && "🍳"}
                {c.slug === "personal-care" && "💆"}
                {c.slug === "electronics" && "📱"}
                {c.slug === "cleaning" && "🧹"}
              </div>
              <span className="font-bold text-center text-sm md:text-base">{lang === "ar" ? c.name_ar : c.name_en}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TODAY DEALS */}
      {bestSellers.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="bg-gradient-luxury text-primary-foreground rounded-3xl p-6 md:p-10 shadow-luxury border border-gold/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-6 h-6 text-gold animate-pulse" />
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gradient-gold">{t(lang, "todayDeals")}</h2>
                </div>
                <p className="text-sm opacity-80">{t(lang, "endsIn")}</p>
              </div>
              <CountdownTimer endsAt={dealsEndsAt} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {bestSellers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      <ProductSection title={t(lang, "bestSellers")} products={bestSellers} />
      {/* NEW */}
      <ProductSection title={t(lang, "newArrivals")} products={newArrivals} />
      {/* FEATURED */}
      <ProductSection title={t(lang, "featured")} products={featured} />
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
