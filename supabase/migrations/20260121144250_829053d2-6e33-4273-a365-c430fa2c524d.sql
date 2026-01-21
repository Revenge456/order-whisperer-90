-- Modificar políticas de customers para permitir operaciones sin autenticación (desarrollo)
-- En producción se deben cambiar a políticas que requieran auth.uid()

DROP POLICY IF EXISTS "Allow authenticated insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated read on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated update on customers" ON public.customers;

-- Crear políticas permisivas para desarrollo
CREATE POLICY "Allow all insert on customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all read on customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all update on customers" 
ON public.customers 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete on customers" 
ON public.customers 
FOR DELETE 
USING (true);

-- También para products y orders (los otros que tienen custom_fields)
DROP POLICY IF EXISTS "Allow authenticated insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated read on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update on products" ON public.products;

CREATE POLICY "Allow all insert on products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all read on products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all update on products" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete on products" 
ON public.products 
FOR DELETE 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated read on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated update on orders" ON public.orders;

CREATE POLICY "Allow all insert on orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all read on orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all update on orders" 
ON public.orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete on orders" 
ON public.orders 
FOR DELETE 
USING (true);