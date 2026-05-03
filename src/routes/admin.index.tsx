import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Package, DollarSign, Clock, Loader2 } from "lucide-react";
import { getDashboardStats } from "@/server/admin.functions";
import { formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((s) => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "إجمالي الطلبات", value: stats.totalOrders, icon: ShoppingBag, color: "text-gold" },
    { label: "طلبات قيد المعالجة", value: stats.pendingOrders, icon: Clock, color: "text-success" },
    { label: "المنتجات النشطة", value: stats.totalProducts, icon: Package, color: "text-gold" },
    { label: "إيرادات 30 يوم", value: formatPrice(stats.revenue30, "ar"), icon: DollarSign, color: "text-success" },
  ];

  const statusLabels: Record<string, string> = {
    pending: "قيد المعالجة", confirmed: "تم التأكيد", shipped: "تم الشحن",
    delivered: "تم التسليم", cancelled: "ملغي",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold">لوحة التحكم</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-strong rounded-2xl p-4 md:p-5 border border-border">
            <c.icon className={`w-7 h-7 ${c.color} mb-2`} />
            <div className="text-xs md:text-sm text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl md:text-2xl font-extrabold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-4 md:p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">آخر الطلبات</h2>
          <Link to="/admin/orders" className="text-gold text-sm font-bold hover:underline">عرض الكل</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-muted-foreground border-b border-border">
                <th className="py-2 text-start font-semibold">رقم الطلب</th>
                <th className="py-2 text-start font-semibold">العميل</th>
                <th className="py-2 text-start font-semibold">المبلغ</th>
                <th className="py-2 text-start font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-accent/40">
                  <td className="py-3 font-mono text-gold">
                    <Link to="/admin/orders" className="hover:underline">#{o.order_number}</Link>
                  </td>
                  <td className="py-3">{o.customer_name}</td>
                  <td className="py-3 font-bold">{formatPrice(Number(o.final_price), "ar")}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-accent">{statusLabels[o.status] ?? o.status}</span></td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
