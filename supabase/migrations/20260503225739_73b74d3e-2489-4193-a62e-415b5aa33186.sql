DROP POLICY IF EXISTS "No public access coupons" ON public.coupons;
CREATE POLICY "No public access coupons"
ON public.coupons
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access orders" ON public.orders;
CREATE POLICY "No public access orders"
ON public.orders
FOR ALL
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public access order items" ON public.order_items;
CREATE POLICY "No public access order items"
ON public.order_items
FOR ALL
USING (false)
WITH CHECK (false);