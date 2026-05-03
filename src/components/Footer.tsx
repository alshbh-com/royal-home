import { Crown } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

export function Footer() {
  const { lang } = useApp();
  return (
    <footer className="bg-gradient-luxury text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Crown className="w-6 h-6 text-gold-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold text-gradient-gold">Royal</span>
          </div>
          <div className="text-sm opacity-70">
            © {new Date().getFullYear()} Royal. {t(lang, "allRights")}
          </div>
        </div>
      </div>
    </footer>
  );
}
