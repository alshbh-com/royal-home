import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Eye, ShoppingCart, CreditCard, TrendingUp, Users, Package2, Percent } from "lucide-react";
import { getAnalytics } from "@/serverfn/admin.functions";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics({ data: { days } })
      .then((s) => { setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "زوار المتجر (جلسات)", value: stats.totalSessions, icon: Users },
    { label: "مشاهدات الصفحات", value: stats.pageViews, icon: Eye },
    { label: "شاهدوا منتج", value: stats.productViewSessions, icon: Package2 },
    { label: "أضافوا للسلة", value: stats.addToCartSessions, icon: ShoppingCart },
    { label: "بدأوا الدفع", value: stats.checkoutSessions, icon: CreditCard },
    { label: "أتمّوا الشراء", value: stats.purchaseSessions, icon: TrendingUp },
    { label: "سلال متروكة", value: stats.abandoned, icon: ShoppingCart },
    { label: "معدل التحويل", value: `${stats.conversionRate}%`, icon: Percent },
  ];

  const maxDaily = Math.max(1, ...stats.daily.map((d) => Math.max(d.sessions, d.views)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">إحصائيات المتجر</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-2 rounded-xl text-sm font-bold ${days === d ? "bg-gradient-gold text-gold-foreground" : "bg-accent"}`}>
              {d} يوم
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-strong rounded-2xl p-4 border border-border">
            <c.icon className="w-6 h-6 text-gold mb-2" />
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl md:text-2xl font-extrabold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-strong rounded-2xl p-4 md:p-5 border border-border">
          <h2 className="text-lg font-extrabold mb-4">قمع المبيعات</h2>
          <Funnel stats={stats} />
        </div>

        <div className="glass-strong rounded-2xl p-4 md:p-5 border border-border">
          <h2 className="text-lg font-extrabold mb-4">أكثر المنتجات مشاهدة</h2>
          {stats.topProducts.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">لا توجد بيانات بعد</div>
          ) : (
            <ul className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-accent/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gradient-gold text-gold-foreground text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                    <span className="truncate font-semibold">{p.name_ar}</span>
                  </div>
                  <span className="font-bold text-gold whitespace-nowrap">{p.views} مشاهدة</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 md:p-5 border border-border">
        <h2 className="text-lg font-extrabold mb-4">النشاط اليومي</h2>
        {stats.daily.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 text-sm">لا توجد بيانات بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-w-[600px] h-48">
              {stats.daily.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-[28px]">
                  <div className="w-full flex items-end gap-0.5 flex-1">
                    <div className="flex-1 bg-gold rounded-t" style={{ height: `${(d.sessions / maxDaily) * 100}%` }} title={`${d.sessions} جلسة`} />
                    <div className="flex-1 bg-success rounded-t" style={{ height: `${(d.views / maxDaily) * 100}%` }} title={`${d.views} مشاهدة`} />
                  </div>
                  <div className="text-[10px] text-muted-foreground rotate-45 origin-top-left h-6">{d.day.slice(5)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs mt-2">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-gold rounded-sm" /> جلسات</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-success rounded-sm" /> مشاهدات</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Funnel({ stats }: { stats: Awaited<ReturnType<typeof getAnalytics>> }) {
  const steps = [
    { label: "زوار", value: stats.totalSessions },
    { label: "شاهدوا منتج", value: stats.productViewSessions },
    { label: "أضافوا للسلة", value: stats.addToCartSessions },
    { label: "بدأوا الدفع", value: stats.checkoutSessions },
    { label: "أتمّوا الشراء", value: stats.purchaseSessions },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">{s.label}</span>
            <span className="font-bold text-gold">{s.value}</span>
          </div>
          <div className="h-3 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-gradient-gold" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
