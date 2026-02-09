-- Crear bucket para comprobantes de pago
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier persona puede ver los comprobantes (bucket público)
CREATE POLICY "Payment receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Política: usuarios autenticados pueden subir comprobantes
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

-- Política: usuarios autenticados pueden actualizar comprobantes
CREATE POLICY "Authenticated users can update payment receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-receipts');

-- Política: usuarios autenticados pueden eliminar comprobantes
CREATE POLICY "Authenticated users can delete payment receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-receipts');