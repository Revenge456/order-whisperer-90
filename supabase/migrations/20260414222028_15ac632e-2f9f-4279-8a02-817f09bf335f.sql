
CREATE POLICY "Authenticated users can upload to Canal 1"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'Canal 1');

CREATE POLICY "Authenticated users can update in Canal 1"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'Canal 1');

CREATE POLICY "Authenticated users can delete from Canal 1"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'Canal 1');
