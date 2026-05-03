import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, ShoppingBag } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/order-success/$orderNumber")({
  component: SuccessPage,
  head: () => ({ meta: [{ title: "تم الطلب — Royal" }] }),
});

function SuccessPage() {
  const { lang } = useApp();
  const { orderNumber } = Route.useParams();

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-xl mx-auto glass-strong rounded-3xl p-8 md:p-12 text-center shadow-luxury">
        <div className="w-20 h-20 mx-auto bg-gradient-gold rounded-full flex items-center justify-center shadow-gold animate-glow mb-6">
          <CheckCircle2 className="w-12 h-12 text-gold-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{t(lang, "orderSuccess")}</h1>
        <p className="text-muted-foreground mb-6">{t(lang, "orderSuccessMsg")}</p>

        <div className="bg-gradient-luxury text-primary-foreground rounded-2xl p-5 mb-6">
          <div className="text-sm opacity-80">{t(lang, "orderNumber")}</div>
          <div className="text-2xl md:text-3xl font-extrabold text-gradient-gold mt-1 tracking-wider">{orderNumber}</div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {lang === "ar" ? "احتفظ برقم الطلب للمتابعة. سيتصل بك ممثل خدمة العملاء خلال 24 ساعة." : "Save your order number. Our team will contact you within 24h."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1 btn-3d-gold rounded-xl py-3 font-bold flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> {t(lang, "backHome")}
          </Link>
          <Link to="/shop" className="flex-1 rounded-xl py-3 font-bold border-2 border-gold text-gold hover:bg-gold hover:text-gold-foreground transition-all flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" /> {t(lang, "continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
