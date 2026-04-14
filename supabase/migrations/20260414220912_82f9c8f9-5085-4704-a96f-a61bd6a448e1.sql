INSERT INTO public.table_column_definitions (module_key, column_key, column_name, column_type, is_system, is_visible, is_required, column_order, column_width)
SELECT 'products', 'image_url', 'Imagen', 'file', true, true, false, -1, 60
WHERE NOT EXISTS (
  SELECT 1 FROM public.table_column_definitions 
  WHERE module_key = 'products' AND column_key = 'image_url'
);