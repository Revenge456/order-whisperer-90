CREATE POLICY "Allow authenticated insert on audit_log"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);