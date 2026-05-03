import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import royalLogo from "@/assets/royal-logo.jpg";
import { adminLogin } from "@/server/admin.functions";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin({ data: { password } });
      toast.success("تم تسجيل الدخول");
      // Hard navigation to ensure cookie is sent on the next request
      window.location.href = "/admin";
    } catch (err: any) {
      toast.error(err?.message ?? "كلمة مرور خاطئة");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-luxury border border-gold/30">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary border border-gold/40 shadow-gold">
            <img src={royalLogo} alt="Royal" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-gradient-gold">لوحة الأدمن</h1>
          <p className="text-sm text-muted-foreground">سجّل الدخول للوصول إلى الإدارة</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-4 w-5 h-5 text-muted-foreground" />
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full ps-12 pe-4 py-4 rounded-xl bg-card border border-border focus:border-gold outline-none font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-3d-gold rounded-xl py-4 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
