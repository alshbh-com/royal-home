import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { listOrders, getOrder, updateOrderStatus } from "@/server/admin.functions";
import { formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const statusLabels: Record<string, string> = {
  pending: "قيد المعالجة", confirmed: "تم التأكيد", shipped: "تم الشحن",
  delivered: "تم التسليم", cancelled: "ملغي",
};
const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-500",
  confirmed: "bg-blue-500/15 text-blue-500",
  shipped: "bg-indigo-500/15 text-indigo-500",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listOrders({ data: { status: filter, search } });
      setOrders(list);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold">إدارة الطلبات</h1>

      <div className="glass-strong rounded-2xl p-4 border border-border space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm ${filter === "all" ? "bg-gradient-gold text-gold-foreground" : "bg-accent"}`}>
            الكل
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm ${filter === s ? "bg-gradient-gold text-gold-foreground" : "bg-accent"}`}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="رقم الطلب، اسم العميل، أو رقم الهاتف"
              className="w-full ps-10 pe-4 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>
          <button type="submit" className="btn-3d-gold rounded-xl px-5 py-2 font-bold">بحث</button>
        </form>
      </div>

      <div className="glass-strong rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/40">
                  <th className="py-3 px-4 text-start font-semibold">الرقم</th>
                  <th className="py-3 px-4 text-start font-semibold">العميل</th>
                  <th className="py-3 px-4 text-start font-semibold">الهاتف</th>
                  <th className="py-3 px-4 text-start font-semibold">المحافظة</th>
                  <th className="py-3 px-4 text-start font-semibold">المبلغ</th>
                  <th className="py-3 px-4 text-start font-semibold">الحالة</th>
                  <th className="py-3 px-4 text-start font-semibold">التاريخ</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-3 px-4 font-mono text-gold">#{o.order_number}</td>
                    <td className="py-3 px-4">{o.customer_name}</td>
                    <td className="py-3 px-4 font-mono">{o.phone}</td>
                    <td className="py-3 px-4">{o.governorate}</td>
                    <td className="py-3 px-4 font-bold">{formatPrice(Number(o.final_price), "ar")}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColors[o.status] ?? ""}`}>
                        {statusLabels[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setOpenId(o.id)} className="p-2 rounded-lg hover:bg-accent" aria-label="عرض">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد طلبات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} onUpdated={load} />}
    </div>
  );
}

function OrderDrawer({ id, onClose, onUpdated }: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [data, setData] = useState<{ order: any; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrder({ data: { id } }).then((r) => { setData(r); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status: string) => {
    setSaving(true);
    try {
      await updateOrderStatus({ data: { id, status: status as any } });
      toast.success("تم تحديث الحالة");
      setData((d) => d ? { ...d, order: { ...d.order, status } } : d);
      onUpdated();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card text-foreground w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-gold/30 shadow-luxury">
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-4">
          <h2 className="font-extrabold text-lg">تفاصيل الطلب {data?.order.order_number ? `#${data.order.order_number}` : ""}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
        </div>
        {loading || !data ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="العميل" value={data.order.customer_name} />
              <Field label="الهاتف" value={data.order.phone} />
              <Field label="المحافظة" value={data.order.governorate} />
              <Field label="الإجمالي" value={formatPrice(Number(data.order.final_price), "ar")} />
              <div className="col-span-2"><Field label="العنوان" value={data.order.address} /></div>
              {data.order.notes && <div className="col-span-2"><Field label="ملاحظات" value={data.order.notes} /></div>}
            </div>
            <div>
              <h3 className="font-bold mb-2">المنتجات</h3>
              <div className="space-y-2">
                {data.items.map((it: any) => (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border">
                    {it.product_image && <img src={it.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{it.product_name}</div>
                      <div className="text-muted-foreground text-xs">
                        {it.quantity} × {formatPrice(Number(it.price), "ar")}
                        {it.selected_color ? ` · ${it.selected_color}` : ""}
                        {it.selected_size ? ` · ${it.selected_size}` : ""}
                      </div>
                    </div>
                    <div className="font-bold">{formatPrice(Number(it.subtotal), "ar")}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">تغيير الحالة</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} disabled={saving || data.order.status === s} onClick={() => changeStatus(s)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 ${data.order.status === s ? "bg-gradient-gold text-gold-foreground" : "bg-accent hover:bg-accent/70"}`}>
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
