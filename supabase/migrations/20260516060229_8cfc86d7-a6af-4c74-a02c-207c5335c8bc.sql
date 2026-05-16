CREATE POLICY "Admins can insert categories"
ON public.product_categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.product_categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.product_categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));