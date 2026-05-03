-- Categories
INSERT INTO public.categories (id, name_en, name_ar, slug, description_ar, image_url, sort_order) VALUES
('11111111-1111-1111-1111-111111111101', 'Watches', 'ساعات', 'watches', 'ساعات فاخرة', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 1),
('11111111-1111-1111-1111-111111111102', 'Accessories', 'إكسسوارات', 'accessories', 'إكسسوارات أنيقة', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 2),
('11111111-1111-1111-1111-111111111103', 'Bags', 'حقائب', 'bags', 'حقائب فاخرة', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', 3),
('11111111-1111-1111-1111-111111111104', 'Perfumes', 'عطور', 'perfumes', 'عطور راقية', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600', 4);

-- Products
INSERT INTO public.products (category_id, name_en, name_ar, slug, description_ar, short_description_ar, images, stock, price, compare_at_price, is_featured, is_bestseller, is_new, rating, reviews_count) VALUES
('11111111-1111-1111-1111-111111111101', 'Classic Gold Watch', 'ساعة كلاسيك ذهبية', 'classic-gold-watch', 'ساعة فاخرة بتصميم كلاسيكي وحركة سويسرية', 'تصميم كلاسيكي خالد', '["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800","https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800"]'::jsonb, 25, 2500, 3200, true, true, false, 4.8, 124),
('11111111-1111-1111-1111-111111111101', 'Sport Black Watch', 'ساعة سبورت سوداء', 'sport-black-watch', 'ساعة رياضية مقاومة للماء', 'تصميم رياضي عصري', '["https://images.unsplash.com/photo-1means7374-43cb52ce6499?w=800","https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800"]'::jsonb, 40, 1800, NULL, true, false, true, 4.6, 56),
('11111111-1111-1111-1111-111111111102', 'Leather Bracelet', 'إسوارة جلد', 'leather-bracelet', 'إسوارة جلد طبيعي بتفاصيل ذهبية', 'جلد طبيعي 100%', '["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"]'::jsonb, 60, 450, 600, false, true, false, 4.5, 89),
('11111111-1111-1111-1111-111111111102', 'Silver Necklace', 'عقد فضة', 'silver-necklace', 'عقد فضة استرلينية 925', 'فضة 925', '["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"]'::jsonb, 30, 850, NULL, true, false, true, 4.7, 42),
('11111111-1111-1111-1111-111111111103', 'Royal Leather Bag', 'حقيبة جلد رويال', 'royal-leather-bag', 'حقيبة جلد طبيعي فاخرة بتصميم عصري', 'سعة كبيرة وأناقة', '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800","https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]'::jsonb, 15, 1950, 2400, true, true, false, 4.9, 201),
('11111111-1111-1111-1111-111111111103', 'Mini Cross Bag', 'حقيبة كروس صغيرة', 'mini-cross-bag', 'حقيبة كروس عملية للاستخدام اليومي', 'خفيفة وعملية', '["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800"]'::jsonb, 50, 750, NULL, false, false, true, 4.4, 33),
('11111111-1111-1111-1111-111111111104', 'Royal Oud Perfume', 'عطر رويال عود', 'royal-oud-perfume', 'عطر شرقي فاخر بنفحات العود والمسك', 'ثبات 12 ساعة', '["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800"]'::jsonb, 80, 1200, 1500, true, true, false, 4.9, 312),
('11111111-1111-1111-1111-111111111104', 'Floral Mist Perfume', 'عطر فلورال ميست', 'floral-mist-perfume', 'عطر زهري منعش للمرأة العصرية', 'نفحات زهرية منعشة', '["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800"]'::jsonb, 65, 980, NULL, false, false, true, 4.6, 78);

-- Shipping rates
INSERT INTO public.shipping_rates (governorate, price, delivery_days) VALUES
('القاهرة', 50, '1-2 أيام'),
('الجيزة', 50, '1-2 أيام'),
('الإسكندرية', 70, '2-3 أيام'),
('الدقهلية', 80, '3-4 أيام'),
('الشرقية', 80, '3-4 أيام');

-- Banner
INSERT INTO public.banners (image_url, title_ar, subtitle_ar, cta_text_ar, link_url, position) VALUES
('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', 'تشكيلة Royal الجديدة', 'اكتشف أرقى المنتجات بأفضل الأسعار', 'تسوق الآن', '/shop', 'hero');

-- Coupon
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit) VALUES
('WELCOME10', 'percentage', 10, 500, 200, 1000);