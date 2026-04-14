-- SELECT policy for public read
CREATE POLICY "Public read Product storage"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Product storage');

-- Anon INSERT
CREATE POLICY "Anon upload to Product storage"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'Product storage'
  AND name LIKE 'productos/%'
);

-- Anon UPDATE
CREATE POLICY "Anon update in Product storage"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'Product storage' AND name LIKE 'productos/%')
WITH CHECK (bucket_id = 'Product storage' AND name LIKE 'productos/%');

-- Anon DELETE
CREATE POLICY "Anon delete from Product storage"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'Product storage' AND name LIKE 'productos/%');

-- Authenticated INSERT
CREATE POLICY "Auth upload to Product storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Product storage'
  AND name LIKE 'productos/%'
);

-- Authenticated UPDATE
CREATE POLICY "Auth update in Product storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Product storage' AND name LIKE 'productos/%')
WITH CHECK (bucket_id = 'Product storage' AND name LIKE 'productos/%');

-- Authenticated DELETE
CREATE POLICY "Auth delete from Product storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Product storage' AND name LIKE 'productos/%');