CREATE SEQUENCE IF NOT EXISTS public.orders_serial_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT nextval('public.orders_serial_seq')::text;

-- Reset sequence based on existing numeric order numbers (if any)
SELECT setval('public.orders_serial_seq',
  GREATEST(
    1,
    COALESCE((SELECT MAX(order_number::bigint) FROM public.orders WHERE order_number ~ '^[0-9]+$'), 0) + 1
  ),
  false
);