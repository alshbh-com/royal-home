
-- ============================================
-- ROYAL Store Database Schema
-- ============================================

-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  short_description_ar TEXT,
  short_description_en TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0),
  cost NUMERIC(10,2),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDERS
-- ============================================
CREATE TYPE public.order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT 'RYL-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*10000)::text,4,'0'),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  final_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_phone ON public.orders(phone);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  selected_color TEXT,
  selected_size TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================
-- BANNERS
-- ============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT,
  title_en TEXT,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  cta_text_ar TEXT,
  cta_text_en TEXT,
  position TEXT NOT NULL DEFAULT 'hero',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COUPONS
-- ============================================
CREATE TYPE public.discount_type AS ENUM ('percentage','fixed');

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);

-- ============================================
-- SHIPPING RATES
-- ============================================
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_shipping_rates_updated BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SETTINGS
-- ============================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ADMIN CREDENTIALS (single-row password)
-- ============================================
CREATE TABLE public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- ============================================
-- RATE LIMITING (anti-spam orders)
-- ============================================
CREATE TABLE public.order_rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES — public read for storefront data
-- ============================================
CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active banners" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Public insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (is_approved = false);

CREATE POLICY "Public read shipping rates" ON public.shipping_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

-- Coupons: public can read only active ones (needed for code lookup)
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Orders: anyone can create an order (guest checkout)
CREATE POLICY "Public create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- NO public SELECT on orders / order_items / admin_* / rate_limits
-- These are accessed only via server (service role) to protect customer PII.

-- ============================================
-- SEED: settings, shipping rates, admin password
-- ============================================
INSERT INTO public.settings (key, value) VALUES
  ('free_shipping_threshold', '1500'::jsonb),
  ('show_support_button', 'true'::jsonb),
  ('store_name_ar', '"رويال"'::jsonb),
  ('store_name_en', '"Royal"'::jsonb),
  ('currency', '"EGP"'::jsonb);

INSERT INTO public.shipping_rates (governorate, price, delivery_days) VALUES
  ('القاهرة', 50, '1-2 أيام'),
  ('الجيزة', 50, '1-2 أيام'),
  ('الإسكندرية', 70, '2-3 أيام'),
  ('الدقهلية', 70, '2-3 أيام'),
  ('الشرقية', 70, '2-3 أيام'),
  ('القليوبية', 60, '1-2 أيام'),
  ('المنوفية', 70, '2-3 أيام'),
  ('الغربية', 70, '2-3 أيام'),
  ('كفر الشيخ', 80, '2-3 أيام'),
  ('البحيرة', 80, '2-3 أيام'),
  ('دمياط', 80, '2-3 أيام'),
  ('بورسعيد', 80, '2-3 أيام'),
  ('الإسماعيلية', 80, '2-3 أيام'),
  ('السويس', 80, '2-3 أيام'),
  ('الفيوم', 90, '3-4 أيام'),
  ('بني سويف', 90, '3-4 أيام'),
  ('المنيا', 100, '3-4 أيام'),
  ('أسيوط', 100, '3-4 أيام'),
  ('سوهاج', 110, '3-5 أيام'),
  ('قنا', 120, '3-5 أيام'),
  ('الأقصر', 120, '3-5 أيام'),
  ('أسوان', 130, '4-5 أيام'),
  ('مطروح', 130, '4-5 أيام'),
  ('شمال سيناء', 150, '5-7 أيام'),
  ('جنوب سيناء', 150, '5-7 أيام'),
  ('البحر الأحمر', 130, '4-5 أيام'),
  ('الوادي الجديد', 150, '5-7 أيام');

-- Admin password "Abdosafty500500" hashed with bcrypt (cost 10)
INSERT INTO public.admin_credentials (password_hash) VALUES
  ('$2b$10$pZc9Fm7wXkqYJ5nQ1xXr.eZ9k2vJ3hG8sKfL6pR4tWqB9mN8bC7yi');

-- Storage bucket for product/banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('royal-media', 'royal-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read royal-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'royal-media');

-- ============================================
-- SEED demo categories & products so storefront isn't empty
-- ============================================
INSERT INTO public.categories (name_ar, name_en, slug, icon, sort_order) VALUES
  ('المطبخ', 'Kitchen', 'kitchen', 'ChefHat', 1),
  ('العناية الشخصية', 'Personal Care', 'personal-care', 'Sparkles', 2),
  ('الإلكترونيات', 'Electronics', 'electronics', 'Smartphone', 3),
  ('التنظيف', 'Cleaning', 'cleaning', 'Wind', 4);

INSERT INTO public.products (category_id, name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, price, compare_at_price, images, stock, colors, is_featured, is_bestseller, is_new)
SELECT
  (SELECT id FROM public.categories WHERE slug='kitchen'),
  'خلاط احترافي 1000 وات', 'Professional Blender 1000W', 'pro-blender-1000w',
  'خلاط قوي 1000 وات بشفرات ستانلس ستيل، مثالي لجميع احتياجات المطبخ.',
  'Powerful 1000W blender with stainless steel blades.',
  'قوة 1000 وات • شفرات ستانلس', '1000W power • Stainless blades',
  1299, 1799,
  '["https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800"]'::jsonb,
  25, '["أسود","فضي"]'::jsonb, true, true, false
UNION ALL SELECT
  (SELECT id FROM public.categories WHERE slug='kitchen'),
  'مكنسة كهربائية لاسلكية', 'Cordless Vacuum Cleaner', 'cordless-vacuum',
  'مكنسة لاسلكية خفيفة الوزن مع بطارية تدوم طويلاً.',
  'Lightweight cordless vacuum with long-lasting battery.',
  'بطارية 60 دقيقة', '60-min battery',
  2499, 3299,
  '["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"]'::jsonb,
  12, '["أحمر","أزرق"]'::jsonb, true, true, true
UNION ALL SELECT
  (SELECT id FROM public.categories WHERE slug='personal-care'),
  'مجفف شعر احترافي', 'Professional Hair Dryer', 'pro-hair-dryer',
  'مجفف شعر بتقنية الأيونات لشعر ناعم ولامع.',
  'Ionic hair dryer for smooth, shiny hair.',
  'تقنية الأيونات', 'Ionic technology',
  899, 1199,
  '["https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800"]'::jsonb,
  40, '["وردي","أسود"]'::jsonb, false, true, false
UNION ALL SELECT
  (SELECT id FROM public.categories WHERE slug='electronics'),
  'سماعات بلوتوث لاسلكية', 'Wireless Bluetooth Earbuds', 'wireless-earbuds',
  'سماعات لاسلكية بجودة صوت فائقة وعزل ضوضاء نشط.',
  'Wireless earbuds with premium sound and active noise cancellation.',
  'عزل ضوضاء نشط', 'Active noise cancelling',
  799, 1299,
  '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800"]'::jsonb,
  60, '["أبيض","أسود"]'::jsonb, true, false, true
UNION ALL SELECT
  (SELECT id FROM public.categories WHERE slug='kitchen'),
  'محمصة خبز ذكية', 'Smart Toaster', 'smart-toaster',
  'محمصة بشاشة LED و7 درجات تحميص.',
  'Smart toaster with LED display and 7 toasting levels.',
  '7 درجات تحميص', '7 toast levels',
  649, 899,
  '["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800"]'::jsonb,
  3, '["أسود"]'::jsonb, false, false, true
UNION ALL SELECT
  (SELECT id FROM public.categories WHERE slug='cleaning'),
  'منظف بخاري متعدد الاستخدامات', 'Multi-purpose Steam Cleaner', 'steam-cleaner',
  'منظف بخاري قوي لجميع أسطح المنزل.',
  'Powerful steam cleaner for all household surfaces.',
  'بخار قوي 1500 وات', '1500W steam',
  1899, 2499,
  '["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"]'::jsonb,
  18, '[]'::jsonb, true, false, false;

INSERT INTO public.banners (title_ar, title_en, subtitle_ar, subtitle_en, image_url, cta_text_ar, cta_text_en, link_url, position, sort_order) VALUES
  ('خصومات تصل إلى 40%', 'Up to 40% OFF', 'على الأجهزة المنزلية المختارة', 'On selected home appliances',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600', 'تسوق الآن', 'Shop Now', '/shop', 'hero', 1);
