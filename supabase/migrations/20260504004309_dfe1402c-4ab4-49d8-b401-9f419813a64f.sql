
INSERT INTO storage.buckets (id, name, public)
VALUES ('royal-media', 'royal-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read royal-media" ON storage.objects;
DROP POLICY IF EXISTS "Public upload royal-media" ON storage.objects;
DROP POLICY IF EXISTS "Public update royal-media" ON storage.objects;
DROP POLICY IF EXISTS "Public delete royal-media" ON storage.objects;

CREATE POLICY "Public read royal-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'royal-media');

CREATE POLICY "Public upload royal-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'royal-media');

CREATE POLICY "Public update royal-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'royal-media');

CREATE POLICY "Public delete royal-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'royal-media');
