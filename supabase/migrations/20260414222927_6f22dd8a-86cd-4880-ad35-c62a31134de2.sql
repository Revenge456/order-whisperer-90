CREATE POLICY "Anon users can upload product images to Canal 1"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'Canal 1'
  AND name LIKE 'productos/%'
);

CREATE POLICY "Anon users can update product images in Canal 1"
ON storage.objects
FOR UPDATE
TO anon
USING (
  bucket_id = 'Canal 1'
  AND name LIKE 'productos/%'
)
WITH CHECK (
  bucket_id = 'Canal 1'
  AND name LIKE 'productos/%'
);

CREATE POLICY "Anon users can delete product images from Canal 1"
ON storage.objects
FOR DELETE
TO anon
USING (
  bucket_id = 'Canal 1'
  AND name LIKE 'productos/%'
);