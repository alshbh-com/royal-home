import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
  head: () => ({ meta: [{ title: "الأقسام — Royal" }] }),
});

function CategoriesPage() {
  const { lang } = useApp();
  const [cats, setCats] = useState<Tables<"categories">[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{t(lang, "categories")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cats.map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ category: c.slug }}
            className="group relative aspect-square rounded-3xl bg-gradient-luxury text-primary-foreground p-6 overflow-hidden hover:shadow-luxury transition-all hover:scale-105 flex flex-col items-center justify-center gap-3 border border-gold/20"
          >
            <div className="text-6xl group-hover:scale-110 transition-transform">
              {c.slug === "kitchen" && "🍳"}
              {c.slug === "personal-care" && "💆"}
              {c.slug === "electronics" && "📱"}
              {c.slug === "cleaning" && "🧹"}
            </div>
            <span className="font-extrabold text-lg text-center">{lang === "ar" ? c.name_ar : c.name_en}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
