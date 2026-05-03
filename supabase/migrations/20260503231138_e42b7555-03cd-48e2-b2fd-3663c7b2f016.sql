DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE order_number !~ '^[0-9]+$');
DELETE FROM public.orders WHERE order_number !~ '^[0-9]+$';
SELECT setval('public.orders_serial_seq', 1, false);