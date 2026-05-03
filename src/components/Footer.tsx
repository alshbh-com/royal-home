import { Crown, Phone, Mail, MapPin } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

export function Footer() {
  const { lang } = useApp();
  return (
    <footer className="bg-gradient-luxury text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <Crown className="w-6 h-6 text-gold-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-extrabold text-gradient-gold">Royal</span>
            </div>
            <p className="text-sm opacity-80">{t(lang, "tagline")}</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gold">{t(lang, "shop")}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>{t(lang, "bestSellers")}</li>
              <li>{t(lang, "newArrivals")}</li>
              <li>{t(lang, "todayDeals")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gold">{t(lang, "customerService")}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 16000</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@royal.eg</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {lang === "ar" ? "القاهرة، مصر" : "Cairo, Egypt"}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gold">{lang === "ar" ? "اشترك في النشرة" : "Newsletter"}</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={lang === "ar" ? "بريدك الإلكتروني" : "Your email"}
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/50 focus:outline-none focus:border-gold"
              />
              <button className="px-4 py-2 bg-gradient-gold text-gold-foreground rounded-lg font-bold text-sm">
                {lang === "ar" ? "اشترك" : "Join"}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm opacity-70">
          © {new Date().getFullYear()} Royal. {t(lang, "allRights")}
        </div>
      </div>
    </footer>
  );
}
