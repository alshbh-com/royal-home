
-- 1. Coupons: drop public read
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;

-- 2. Orders & order_items: drop public insert (server uses service role)
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
DROP POLICY IF EXISTS "Public create order items" ON public.order_items;

-- 3. Products: revoke cost column from anon/authenticated
REVOKE SELECT (cost) ON public.products FROM anon, authenticated;

-- 4. Storage: explicitly deny writes to royal-media for non-service roles
CREATE POLICY "Deny client inserts on royal-media"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on royal-media"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'royal-media' AND false);

CREATE POLICY "Deny client deletes on royal-media"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'royal-media' AND false);
