import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, Package, LogOut, Loader2 } from "lucide-react";
import { adminCheck, adminLogout } from "@/server/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    adminCheck()
      .then((r) => {
        setAuthed(r.authenticated);
        setChecking(false);
        if (!r.authenticated && location.pathname !== "/admin/login") {
          navigate({ to: "/admin/login" });
        }
      })
      .catch(() => {
        setChecking(false);
        if (location.pathname !== "/admin/login") navigate({ to: "/admin/login" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (location.pathname === "/admin/login") return <Outlet />;

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

  const navItems = [
    { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
    { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
    { to: "/admin/products", label: "المنتجات", icon: Package },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="glass-strong rounded-2xl p-4 h-fit md:sticky md:top-24">
          <h2 className="text-lg font-extrabold text-gradient-gold mb-4">إدارة Royal</h2>
          <nav className="flex md:flex-col gap-2 overflow-x-auto">
            {navItems.map((n) => (
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
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
