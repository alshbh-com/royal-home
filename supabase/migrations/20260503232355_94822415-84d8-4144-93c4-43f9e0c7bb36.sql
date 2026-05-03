CREATE TABLE public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  session_id text not null,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  path text,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_product ON public.analytics_events(product_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public read analytics" ON public.analytics_events
  FOR SELECT USING (false);
CREATE POLICY "Deny public insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (false);