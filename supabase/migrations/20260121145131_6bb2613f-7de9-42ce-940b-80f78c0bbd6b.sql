-- Tabla de permisos de acciones (CRUD por página/módulo y rol)
CREATE TABLE IF NOT EXISTS public.action_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    page_key varchar(50) NOT NULL,
    can_create boolean DEFAULT false,
    can_read boolean DEFAULT true,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role, page_key)
);

-- Habilitar RLS
ALTER TABLE public.action_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage action_permissions"
ON public.action_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view action_permissions"
ON public.action_permissions
FOR SELECT
USING (true);

-- Función para verificar permisos de acción
CREATE OR REPLACE FUNCTION public.can_perform_action(
    _user_id uuid, 
    _page_key varchar, 
    _action varchar
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT 
            CASE _action
                WHEN 'create' THEN ap.can_create
                WHEN 'read' THEN ap.can_read
                WHEN 'update' THEN ap.can_update
                WHEN 'delete' THEN ap.can_delete
                ELSE false
            END
         FROM public.action_permissions ap
         INNER JOIN public.user_roles ur ON ur.role = ap.role
         WHERE ur.user_id = _user_id
           AND ap.page_key = _page_key
         LIMIT 1),
        false
    )
$$;

-- Insertar permisos por defecto para Admin (acceso total)
INSERT INTO public.action_permissions (role, page_key, can_create, can_read, can_update, can_delete) VALUES
('admin', 'dashboard', true, true, true, true),
('admin', 'customers', true, true, true, true),
('admin', 'orders', true, true, true, true),
('admin', 'deliveries', true, true, true, true),
('admin', 'products', true, true, true, true),
('admin', 'reports', true, true, true, true),
('admin', 'team', true, true, true, true)
ON CONFLICT (role, page_key) DO NOTHING;

-- Insertar permisos por defecto para Employee (solo lectura en la mayoría)
INSERT INTO public.action_permissions (role, page_key, can_create, can_read, can_update, can_delete) VALUES
('employee', 'dashboard', false, true, false, false),
('employee', 'customers', true, true, true, false),
('employee', 'orders', true, true, true, false),
('employee', 'deliveries', false, true, true, false),
('employee', 'products', false, true, false, false),
('employee', 'reports', false, true, false, false),
('employee', 'team', false, false, false, false)
ON CONFLICT (role, page_key) DO NOTHING;

-- Asegurar que page_permissions tenga las páginas correctas
INSERT INTO public.page_permissions (role, page_key, can_access) VALUES
('admin', 'dashboard', true),
('admin', 'customers', true),
('admin', 'orders', true),
('admin', 'deliveries', true),
('admin', 'products', true),
('admin', 'reports', true),
('admin', 'team', true),
('employee', 'dashboard', true),
('employee', 'customers', true),
('employee', 'orders', true),
('employee', 'deliveries', true),
('employee', 'products', true),
('employee', 'reports', true),
('employee', 'team', false)
ON CONFLICT (role, page_key) DO NOTHING;