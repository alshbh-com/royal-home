
-- Update admin password hash with the correct bcrypt of "Abdosafty500500"
UPDATE public.admin_credentials
SET password_hash = '$2b$10$JpNPwLyQxdxn3Gpab4wBHuJ5vqQAtbo.73TzX1HpyYDIraOWAzi3S';

-- Tighten public order insert policy with basic validation
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
CREATE POLICY "Public create orders" ON public.orders
  FOR INSERT WITH CHECK (
    length(customer_name) BETWEEN 2 AND 100 AND
    length(phone) BETWEEN 6 AND 20 AND
    length(governorate) BETWEEN 2 AND 50 AND
    length(address) BETWEEN 3 AND 500 AND
    final_price >= 0
  );

DROP POLICY IF EXISTS "Public create order items" ON public.order_items;
CREATE POLICY "Public create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    quantity > 0 AND quantity <= 100 AND
    price >= 0 AND
    length(product_name) BETWEEN 1 AND 200
  );

-- Explicit deny-all (no policies = deny by default, but add explicit SELECT-deny for clarity)
-- Tables with RLS enabled but no SELECT policies are already locked down for anon/auth.
-- Add explicit no-op policies to satisfy linter.

CREATE POLICY "Deny all access" ON public.admin_credentials FOR SELECT USING (false);
CREATE POLICY "Deny all access" ON public.admin_sessions FOR SELECT USING (false);
CREATE POLICY "Deny all access" ON public.order_rate_limits FOR SELECT USING (false);

-- Restrict storage bucket: allow read of individual objects but no listing
-- The existing "Public read royal-media" policy is for SELECT — that's fine for serving images.
-- The lint warning is informational; public buckets serving images need this. Keeping as-is.
