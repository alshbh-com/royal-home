import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { listProducts, upsertProduct, deleteProduct, listCategoriesAdmin } from "@/serverfn/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

type ProductRow = Awaited<ReturnType<typeof listProducts>>[number];

function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name_ar: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([listProducts(), listCategoriesAdmin()]);
      setProducts(p);
      setCategories(c.map((x: any) => ({ id: x.id, name_ar: x.name_ar })));
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success("تم الحذف");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold">إدارة المنتجات</h1>
        <button onClick={() => setEditing({})} className="btn-3d-gold rounded-xl px-4 py-2 font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" /> منتج جديد
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div key={p.id} className="glass-strong rounded-2xl border border-border p-3 flex gap-3">
              <img src={(p.images as any[])?.[0] || "/placeholder.svg"} alt="" className="w-20 h-20 rounded-xl object-cover bg-accent" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{p.name_ar}</div>
                <div className="text-xs text-muted-foreground">المخزون: {p.stock}</div>
                <div className="font-bold text-gold">{formatPrice(Number(p.price), "ar")}</div>
                <div className="flex gap-1 mt-1">
                  {!p.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/20 text-destructive">غير نشط</span>}
                  {p.is_bestseller && <span className="text-[10px] px-2 py-0.5 rounded bg-gold/20 text-gold">الأكثر مبيعاً</span>}
                  {p.is_new && <span className="text-[10px] px-2 py-0.5 rounded bg-success/20 text-success">جديد</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-accent" aria-label="تعديل"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => onDelete(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" aria-label="حذف"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">لا توجد منتجات بعد</div>
          )}
        </div>
      )}

      {editing && (
        <ProductEditor
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductEditor({ initial, categories, onClose, onSaved }:
  { initial: Partial<ProductRow>; categories: { id: string; name_ar: string }[]; onClose: () => void; onSaved: () => void }) {

  const [form, setForm] = useState({
    id: initial.id,
    name_ar: initial.name_ar ?? "",
    name_en: initial.name_en ?? "",
    slug: initial.slug ?? "",
    description_ar: initial.description_ar ?? "",
    description_en: initial.description_en ?? "",
    price: Number(initial.price ?? 0),
    compare_at_price: initial.compare_at_price ? Number(initial.compare_at_price) : null,
    stock: Number(initial.stock ?? 0),
    category_id: initial.category_id ?? null,
    images: ((initial.images as any[]) ?? []) as string[],
    is_active: initial.is_active ?? true,
    is_featured: initial.is_featured ?? false,
    is_bestseller: initial.is_bestseller ?? false,
    is_new: initial.is_new ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "");

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("royal-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("royal-media").getPublicUrl(path);
      setForm((f) => ({ ...f, images: [...f.images, pub.publicUrl] }));
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const removeImage = (i: number) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertProduct({ data: { ...form, slug: form.slug || slugify(form.name_en || form.name_ar) } as any });
      toast.success("تم الحفظ");
      onSaved();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}
        className="bg-card text-foreground w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-gold/30 shadow-luxury">
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-4 z-10">
          <h2 className="font-extrabold text-lg">{form.id ? "تعديل منتج" : "منتج جديد"}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <Input label="اسم المنتج (عربي)" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} required />
          <Input label="Name (English)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} required />
          <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated" />
          <div>
            <label className="text-xs font-semibold text-muted-foreground">القسم</label>
            <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none">
              <option value="">— بدون —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </div>
          <Input label="السعر" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} required />
          <Input label="السعر قبل الخصم" type="number" value={String(form.compare_at_price ?? "")} onChange={(v) => setForm({ ...form, compare_at_price: v ? Number(v) : null })} />
          <Input label="المخزون" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">الوصف (عربي)</label>
            <textarea value={form.description_ar ?? ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              rows={3} className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Description (English)</label>
            <textarea value={form.description_en ?? ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              rows={3} className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">الصور</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 end-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-gold text-xs text-muted-foreground">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5 mb-1" />رفع</>}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              ["is_active", "نشط"], ["is_featured", "مميز"],
              ["is_bestseller", "الأكثر مبيعاً"], ["is_new", "جديد"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                <span className="text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 font-bold bg-accent">إلغاء</button>
          <button type="submit" disabled={saving} className="flex-1 btn-3d-gold rounded-xl py-3 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />} حفظ
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border focus:border-gold outline-none" />
    </div>
  );
}
