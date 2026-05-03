import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { listShippingRates, upsertShippingRate, deleteShippingRate } from "@/server/admin.functions";

export const Route = createFileRoute("/admin/shipping")({
  component: AdminShippingPage,
});

type Row = {
  id: string;
  governorate: string;
  price: number;
  delivery_days: string | null;
  is_active: boolean;
};

const EMPTY = { id: "", governorate: "", price: 0, delivery_days: "", is_active: true };

function AdminShippingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listShippingRates();
      setRows(data as Row[]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.governorate || editing.governorate.length < 2) { toast.error("اسم المحافظة مطلوب"); return; }
    try {
      await upsertShippingRate({
        data: {
          id: editing.id || undefined,
          governorate: editing.governorate.trim(),
          price: Number(editing.price),
          delivery_days: editing.delivery_days || null,
          is_active: editing.is_active,
        },
      });
      toast.success("تم الحفظ");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه المحافظة؟")) return;
    try {
      await deleteShippingRate({ data: { id } });
      toast.success("تم الحذف");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold">المحافظات والشحن</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="btn-3d-gold rounded-xl px-4 py-2 font-bold inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة محافظة
        </button>
      </div>

      {editing && (
        <div className="glass-strong rounded-2xl p-4 md:p-5 border border-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold">{editing.id ? "تعديل" : "إضافة"} محافظة</h3>
            <button onClick={() => setEditing(null)} className="p-2 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">المحافظة *</label>
              <input value={editing.governorate} onChange={(e) => setEditing({ ...editing, governorate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">سعر الشحن (ج.م)</label>
              <input type="number" min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">مدة التوصيل</label>
              <input value={editing.delivery_days ?? ""} placeholder="2-3 أيام" onChange={(e) => setEditing({ ...editing, delivery_days: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[hsl(var(--gold))]" />
                نشط
              </label>
            </div>
          </div>
          <button onClick={save} className="btn-3d-gold rounded-xl px-5 py-2 font-bold inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
      )}

      <div className="glass-strong rounded-2xl p-4 border border-border overflow-x-auto">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-muted-foreground border-b border-border">
                <th className="py-2 text-start">المحافظة</th>
                <th className="py-2 text-start">السعر</th>
                <th className="py-2 text-start">المدة</th>
                <th className="py-2 text-start">الحالة</th>
                <th className="py-2 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-accent/40">
                  <td className="py-3 font-bold">{r.governorate}</td>
                  <td className="py-3">{r.price} ج.م</td>
                  <td className="py-3">{r.delivery_days ?? "—"}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${r.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {r.is_active ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="py-3 text-end">
                    <div className="inline-flex gap-2">
                      <button onClick={() => setEditing({ id: r.id, governorate: r.governorate, price: Number(r.price), delivery_days: r.delivery_days ?? "", is_active: r.is_active })}
                        className="px-3 py-1 rounded-lg bg-accent hover:bg-accent/70 text-xs font-bold">تعديل</button>
                      <button onClick={() => remove(r.id)}
                        className="px-3 py-1 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive text-xs font-bold inline-flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">لا توجد محافظات بعد</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
