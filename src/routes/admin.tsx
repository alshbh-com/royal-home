import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, Package, LogOut, Loader2, Truck, BarChart3 } from "lucide-react";
import { adminCheck, adminLogout } from "@/serverfn/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: { to: "/admin" | "/admin/orders" | "/admin/products" | "/admin/shipping" | "/admin/analytics"; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/shipping", label: "الشحن", icon: Truck },
  { to: "/admin/analytics", label: "إحصائيات", icon: BarChart3 },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/admin/login";
  const [checking, setChecking] = useState(!isLogin);
  const [authed, setAuthed] = useState(false);

  // Run auth check ONCE on mount only (not on every navigation).
  // Re-running on pathname change caused the page to flash/refresh
  // every time the admin clicked between sections.
  useEffect(() => {
    if (isLogin) return;
    let cancelled = false;
    adminCheck()
      .then((r) => {
        if (cancelled) return;
        setAuthed(r.authenticated);
        setChecking(false);
        if (!r.authenticated) navigate({ to: "/admin/login" });
      })
      .catch(() => {
        if (cancelled) return;
        setChecking(false);
        navigate({ to: "/admin/login" });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLogin) return <Outlet />;

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!authed) return null;

  const handleLogout = async () => {
    await adminLogout();
    navigate({ to: "/admin/login" });
  };

  const currentLabel = NAV.find((n) =>
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label ?? "الإدارة";

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground font-semibold">إدارة Royal</div>
          <h1 className="text-lg font-extrabold text-gradient-gold leading-tight">{currentLabel}</h1>
        </div>
        <button
          onClick={handleLogout}
          aria-label="خروج"
          className="p-2.5 rounded-xl bg-destructive/10 text-destructive active:scale-95 transition-transform"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block glass-strong rounded-2xl p-4 h-fit md:sticky md:top-24">
            <h2 className="text-lg font-extrabold text-gradient-gold mb-4">إدارة Royal</h2>
            <nav className="flex flex-col gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.exact }}
                  activeProps={{ className: "bg-gradient-gold text-gold-foreground" }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-accent transition-colors whitespace-nowrap"
                >
                  <n.icon className="w-5 h-5" />
                  <span>{n.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-destructive/10 text-destructive transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج</span>
              </button>
            </nav>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "text-gold" }}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground active:bg-accent/40"
            >
              <n.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
