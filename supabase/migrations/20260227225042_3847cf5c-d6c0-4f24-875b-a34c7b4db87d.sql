-- Allow authenticated users to delete payments
CREATE POLICY "Allow authenticated delete on payments"
  ON public.payments
  FOR DELETE
  USING (true);

-- Allow authenticated users to delete deliveries
CREATE POLICY "Allow authenticated delete on deliveries"
  ON public.deliveries
  FOR DELETE
  USING (true);

-- Allow authenticated users to delete order_items
CREATE POLICY "Allow authenticated delete on order_items"
  ON public.order_items
  FOR DELETE
  USING (true);