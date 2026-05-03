DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = true);
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  short_description_en TEXT,
  short_description_ar TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sku TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL DEFAULT (('RYL-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::text, 4, '0'))),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  total_price NUMERIC NOT NULL DEFAULT 0,
  shipping_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  final_price NUMERIC NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  selected_color TEXT,
  selected_size TEXT,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (is_approved = false);

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title_en TEXT,
  title_ar TEXT,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  cta_text_en TEXT,
  cta_text_ar TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'hero',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active banners" ON public.banners;
CREATE POLICY "Public read active banners" ON public.banners FOR SELECT USING (is_active = true);
DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  governorate TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  delivery_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read shipping rates" ON public.shipping_rates;
CREATE POLICY "Public read shipping rates" ON public.shipping_rates FOR SELECT USING (is_active = true);
DROP TRIGGER IF EXISTS update_shipping_rates_updated_at ON public.shipping_rates;
CREATE TRIGGER update_shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access" ON public.admin_credentials;
CREATE POLICY "Deny all access" ON public.admin_credentials FOR SELECT USING (false);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access" ON public.admin_sessions;
CREATE POLICY "Deny all access" ON public.admin_sessions FOR SELECT USING (false);

CREATE TABLE IF NOT EXISTS public.order_rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access" ON public.order_rate_limits;
CREATE POLICY "Deny all access" ON public.order_rate_limits FOR SELECT USING (false);

INSERT INTO public.categories (id, name_en, name_ar, slug, description_ar, image_url, sort_order) VALUES
('11111111-1111-1111-1111-111111111101', 'Watches', 'ساعات', 'watches', 'ساعات فاخرة', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 1),
('11111111-1111-1111-1111-111111111102', 'Accessories', 'إكسسوارات', 'accessories', 'إكسسوارات أنيقة', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 2),
('11111111-1111-1111-1111-111111111103', 'Bags', 'حقائب', 'bags', 'حقائب فاخرة', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', 3),
('11111111-1111-1111-1111-111111111104', 'Perfumes', 'عطور', 'perfumes', 'عطور راقية', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (category_id, name_en, name_ar, slug, description_ar, short_description_ar, images, stock, price, compare_at_price, is_featured, is_bestseller, is_new, rating, reviews_count) VALUES
('11111111-1111-1111-1111-111111111101', 'Classic Gold Watch', 'ساعة كلاسيك ذهبية', 'classic-gold-watch', 'ساعة فاخرة بتصميم كلاسيكي وحركة سويسرية', 'تصميم كلاسيكي خالد', '["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800","https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800"]'::jsonb, 25, 2500, 3200, true, true, false, 4.8, 124),
('11111111-1111-1111-1111-111111111101', 'Sport Black Watch', 'ساعة سبورت سوداء', 'sport-black-watch', 'ساعة رياضية مقاومة للماء', 'تصميم رياضي عصري', '["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800","https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800"]'::jsonb, 40, 1800, NULL, true, false, true, 4.6, 56),
('11111111-1111-1111-1111-111111111102', 'Leather Bracelet', 'إسوارة جلد', 'leather-bracelet', 'إسوارة جلد طبيعي بتفاصيل ذهبية', 'جلد طبيعي 100%', '["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"]'::jsonb, 60, 450, 600, false, true, false, 4.5, 89),
('11111111-1111-1111-1111-111111111102', 'Silver Necklace', 'عقد فضة', 'silver-necklace', 'عقد فضة استرلينية 925', 'فضة 925', '["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"]'::jsonb, 30, 850, NULL, true, false, true, 4.7, 42),
('11111111-1111-1111-1111-111111111103', 'Royal Leather Bag', 'حقيبة جلد رويال', 'royal-leather-bag', 'حقيبة جلد طبيعي فاخرة بتصميم عصري', 'سعة كبيرة وأناقة', '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800","https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]'::jsonb, 15, 1950, 2400, true, true, false, 4.9, 201),
('11111111-1111-1111-1111-111111111103', 'Mini Cross Bag', 'حقيبة كروس صغيرة', 'mini-cross-bag', 'حقيبة كروس عملية للاستخدام اليومي', 'خفيفة وعملية', '["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800"]'::jsonb, 50, 750, NULL, false, false, true, 4.4, 33),
('11111111-1111-1111-1111-111111111104', 'Royal Oud Perfume', 'عطر رويال عود', 'royal-oud-perfume', 'عطر شرقي فاخر بنفحات العود والمسك', 'ثبات 12 ساعة', '["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800"]'::jsonb, 80, 1200, 1500, true, true, false, 4.9, 312),
('11111111-1111-1111-1111-111111111104', 'Floral Mist Perfume', 'عطر فلورال ميست', 'floral-mist-perfume', 'عطر زهري منعش للمرأة العصرية', 'نفحات زهرية منعشة', '["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800"]'::jsonb, 65, 980, NULL, false, false, true, 4.6, 78)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.shipping_rates (governorate, price, delivery_days) VALUES
('القاهرة', 50, '1-2 أيام'),
('الجيزة', 50, '1-2 أيام'),
('الإسكندرية', 70, '2-3 أيام'),
('الدقهلية', 80, '3-4 أيام'),
('الشرقية', 80, '3-4 أيام')
ON CONFLICT (governorate) DO NOTHING;

INSERT INTO public.banners (image_url, title_ar, subtitle_ar, cta_text_ar, link_url, position)
SELECT 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', 'تشكيلة Royal الجديدة', 'اكتشف أرقى المنتجات بأفضل الأسعار', 'تسوق الآن', '/shop', 'hero'
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE position = 'hero');

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit) VALUES
('WELCOME10', 'percentage', 10, 500, 200, 1000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.admin_credentials (password_hash)
SELECT '$2b$10$.h0Na0N6e1JbTdO/kLK9eOuufoSLzsdU8cfv5LWjzY3HvfSmWCzJ.'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_credentials);