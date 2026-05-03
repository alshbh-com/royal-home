import { Link } from "@tanstack/react-router";
import { ShoppingCart, Sun, Moon, Globe, Menu, X } from "lucide-react";
import royalLogo from "@/assets/royal-logo.jpg";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import { useState } from "react";

export function Header() {
  const { lang, setLang, theme, toggleTheme, cartCount } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
              <Crown className="w-6 h-6 text-gold-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold text-gradient-gold tracking-tight">Royal</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link to="/" className="hover:text-gold transition-colors" activeOptions={{ exact: true }} activeProps={{ className: "text-gold" }}>
              {t(lang, "home")}
            </Link>
            <Link to="/shop" className="hover:text-gold transition-colors" activeProps={{ className: "text-gold" }}>
              {t(lang, "shop")}
            </Link>
            <Link to="/categories" className="hover:text-gold transition-colors" activeProps={{ className: "text-gold" }}>
              {t(lang, "categories")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="w-10 h-10 rounded-xl hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5" />
              <span className="sr-only">{lang === "ar" ? "EN" : "AR"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link
              to="/cart"
              className="relative w-10 h-10 rounded-xl hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gradient-gold text-gold-foreground text-xs font-bold flex items-center justify-center shadow-gold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden w-10 h-10 rounded-xl hover:bg-accent flex items-center justify-center"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden py-4 flex flex-col gap-2 border-t border-border/50">
            <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-accent font-semibold">{t(lang, "home")}</Link>
            <Link to="/shop" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-accent font-semibold">{t(lang, "shop")}</Link>
            <Link to="/categories" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-accent font-semibold">{t(lang, "categories")}</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
