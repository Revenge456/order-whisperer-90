-- ================================================
-- SISTEMA DE ROLES Y PERMISOS - Bolivia Fitness
-- ================================================

-- 1. Crear ENUM para roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'employee',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 3. Tabla de permisos por página
CREATE TABLE IF NOT EXISTS public.page_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    page_key varchar NOT NULL,
    can_access boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role, page_key)
);

-- 4. Insertar permisos por defecto
INSERT INTO public.page_permissions (role, page_key, can_access) VALUES
    ('admin', 'dashboard', true),
    ('admin', 'customers', true),
    ('admin', 'orders', true),
    ('admin', 'deliveries', true),
    ('admin', 'products', true),
    ('admin', 'reports', true),
    ('admin', 'settings', true),
    ('employee', 'dashboard', true),
    ('employee', 'customers', true),
    ('employee', 'orders', true),
    ('employee', 'deliveries', true),
    ('employee', 'products', true),
    ('employee', 'reports', false),
    ('employee', 'settings', false)
ON CONFLICT (role, page_key) DO NOTHING;

-- 5. Habilitar RLS en tablas de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- 6. Función para verificar rol (SECURITY DEFINER para evitar recursión)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 7. Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 8. Función para verificar acceso a página
CREATE OR REPLACE FUNCTION public.can_access_page(_user_id uuid, _page_key varchar)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT pp.can_access
         FROM public.page_permissions pp
         INNER JOIN public.user_roles ur ON ur.role = pp.role
         WHERE ur.user_id = _user_id
           AND pp.page_key = _page_key
         LIMIT 1),
        false
    )
$$;

-- 9. Políticas RLS para user_roles
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 10. Políticas RLS para page_permissions
CREATE POLICY "Authenticated users can view permissions" ON public.page_permissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage permissions" ON public.page_permissions
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 11. Añadir política INSERT a customers
DROP POLICY IF EXISTS "Allow authenticated insert on customers" ON public.customers;
CREATE POLICY "Allow authenticated insert on customers" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 12. Añadir política INSERT a payments
DROP POLICY IF EXISTS "Allow authenticated insert on payments" ON public.payments;
CREATE POLICY "Allow authenticated insert on payments" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 13. Trigger para actualizar estado de pedido cuando pago es confirmado
CREATE OR REPLACE FUNCTION public.sync_order_on_payment_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cuando un pago se confirma, actualizar el pedido a 'confirmado'
    IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
        UPDATE orders
        SET 
            status = 'confirmado',
            confirmed_at = now(),
            updated_at = now()
        WHERE id = NEW.order_id
          AND status = 'nuevo';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_order_on_payment ON public.payments;
CREATE TRIGGER trigger_sync_order_on_payment
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_order_on_payment_confirm();

-- 14. Trigger para crear entrega automáticamente cuando pedido está confirmado
CREATE OR REPLACE FUNCTION public.create_delivery_on_order_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_addr text;
BEGIN
    IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
        -- Obtener dirección del cliente
        SELECT address INTO customer_addr FROM customers WHERE id = NEW.customer_id;
        
        -- Crear entrega si no existe
        INSERT INTO deliveries (order_id, address, status)
        VALUES (NEW.id, COALESCE(customer_addr, 'Sin dirección'), 'sin_asignar')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_delivery_on_order ON public.orders;
CREATE TRIGGER trigger_create_delivery_on_order
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.create_delivery_on_order_confirm();

-- 15. Trigger para actualizar pedido a completado cuando entrega se completa
CREATE OR REPLACE FUNCTION public.complete_order_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'entregado' AND (OLD.status IS NULL OR OLD.status != 'entregado') THEN
        UPDATE orders
        SET 
            status = 'completado',
            completed_at = now(),
            updated_at = now()
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_complete_order_on_delivery ON public.deliveries;
CREATE TRIGGER trigger_complete_order_on_delivery
    AFTER UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.complete_order_on_delivery();

-- 16. Índice para búsqueda sin acentos (usando unaccent extension)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 17. Función para búsqueda normalizada
CREATE OR REPLACE FUNCTION public.normalize_search(text_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT lower(unaccent(COALESCE(text_value, '')))
$$;