-- Add custom_fields JSONB column to customers table for dynamic fields
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Add custom_fields JSONB column to products table for dynamic fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Add custom_fields JSONB column to orders table for dynamic fields  
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_customers_custom_fields ON public.customers USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_products_custom_fields ON public.products USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_orders_custom_fields ON public.orders USING GIN (custom_fields);

-- Add RLS policies for users table to allow admin management
CREATE POLICY "Admins can insert users" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete users" 
ON public.users 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view users" 
ON public.users 
FOR SELECT 
TO authenticated
USING (true);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;