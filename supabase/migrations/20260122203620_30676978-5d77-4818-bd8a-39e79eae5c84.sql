-- ================================================
-- SISTEMA DE TABLAS DINÁMICAS TIPO NOTION
-- ================================================

-- Tipo de dato para columnas dinámicas
CREATE TYPE public.column_type AS ENUM (
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multi_select',
  'status',
  'email',
  'phone',
  'file',
  'url'
);

-- Tabla de definición de columnas por módulo
CREATE TABLE public.table_column_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key VARCHAR(50) NOT NULL, -- 'customers', 'orders', 'deliveries', 'products'
  column_key VARCHAR(100) NOT NULL, -- snake_case key
  column_name VARCHAR(100) NOT NULL, -- Display name
  column_type column_type NOT NULL DEFAULT 'text',
  is_system BOOLEAN NOT NULL DEFAULT false, -- System columns can't be deleted
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  column_order INTEGER NOT NULL DEFAULT 0,
  column_width INTEGER DEFAULT NULL, -- Width in pixels, null = auto
  options JSONB DEFAULT '[]'::jsonb, -- For select/multi-select/status types
  default_value TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_key, column_key)
);

-- Índices para rendimiento
CREATE INDEX idx_column_definitions_module ON public.table_column_definitions(module_key);
CREATE INDEX idx_column_definitions_order ON public.table_column_definitions(module_key, column_order);

-- Enable RLS
ALTER TABLE public.table_column_definitions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "All authenticated users can read column definitions"
ON public.table_column_definitions
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage column definitions"
ON public.table_column_definitions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ================================================
-- CONFIGURACIÓN GLOBAL DEL SISTEMA
-- ================================================

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read settings"
ON public.system_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insertar configuración inicial del AI Agent
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('ai_agent_mode', '{"enabled": true, "default_for_new_customers": true}'::jsonb, 'Configuración global del modo AI Agent');

-- ================================================
-- COLUMNAS DEL SISTEMA PARA CLIENTES
-- ================================================

INSERT INTO public.table_column_definitions (module_key, column_key, column_name, column_type, is_system, is_visible, is_required, column_order, options) VALUES
('customers', 'name', 'Nombre', 'text', true, true, false, 1, NULL),
('customers', 'phone', 'Teléfono', 'phone', true, true, true, 2, NULL),
('customers', 'address', 'Dirección', 'text', true, true, false, 3, NULL),
('customers', 'email', 'Email', 'email', true, true, false, 4, NULL),
('customers', 'is_active', 'Estado', 'status', true, true, false, 5, '[{"value": "true", "label": "Activo", "color": "success"}, {"value": "false", "label": "Inactivo", "color": "muted"}]'),
('customers', 'conversation_mode', 'Modo AI', 'select', true, true, false, 6, '[{"value": "ai", "label": "AI Agent", "color": "primary"}, {"value": "human", "label": "Humano", "color": "warning"}]'),
('customers', 'total_orders', 'Pedidos', 'number', true, true, false, 7, NULL),
('customers', 'total_spent', 'Total Gastado', 'number', true, true, false, 8, NULL),
('customers', 'created_at', 'Fecha Registro', 'date', true, true, false, 9, NULL);

-- ================================================
-- COLUMNAS DEL SISTEMA PARA PEDIDOS
-- ================================================

INSERT INTO public.table_column_definitions (module_key, column_key, column_name, column_type, is_system, is_visible, is_required, column_order, options) VALUES
('orders', 'order_number', 'Nº Pedido', 'text', true, true, true, 1, NULL),
('orders', 'customer_name', 'Cliente', 'text', true, true, false, 2, NULL),
('orders', 'customer_phone', 'Teléfono', 'phone', true, true, false, 3, NULL),
('orders', 'status', 'Estado Pedido', 'status', true, true, false, 4, '[{"value": "nuevo", "label": "Nuevo", "color": "primary"}, {"value": "confirmado", "label": "Confirmado", "color": "success"}, {"value": "preparando", "label": "Preparando", "color": "warning"}, {"value": "listo", "label": "Listo", "color": "success"}, {"value": "en_camino", "label": "En Camino", "color": "primary"}, {"value": "entregado", "label": "Entregado", "color": "success"}, {"value": "cancelado", "label": "Cancelado", "color": "destructive"}]'),
('orders', 'payment_status', 'Estado Pago', 'status', true, true, false, 5, '[{"value": "pendiente", "label": "Pendiente", "color": "warning"}, {"value": "confirmado", "label": "Confirmado", "color": "success"}, {"value": "rechazado", "label": "Rechazado", "color": "destructive"}]'),
('orders', 'payment_method', 'Método Pago', 'select', true, true, false, 6, '[{"value": "qr", "label": "QR"}, {"value": "transferencia", "label": "Transferencia"}, {"value": "efectivo", "label": "Efectivo"}]'),
('orders', 'total', 'Total', 'number', true, true, false, 7, NULL),
('orders', 'created_at', 'Fecha Pedido', 'date', true, true, false, 8, NULL);

-- ================================================
-- COLUMNAS DEL SISTEMA PARA ENTREGAS
-- ================================================

INSERT INTO public.table_column_definitions (module_key, column_key, column_name, column_type, is_system, is_visible, is_required, column_order, options) VALUES
('deliveries', 'order_number', 'Nº Pedido', 'text', true, true, true, 1, NULL),
('deliveries', 'customer_name', 'Cliente', 'text', true, true, false, 2, NULL),
('deliveries', 'address', 'Dirección', 'text', true, true, false, 3, NULL),
('deliveries', 'status', 'Estado', 'status', true, true, false, 4, '[{"value": "sin_asignar", "label": "Sin Asignar", "color": "muted"}, {"value": "asignado", "label": "Asignado", "color": "primary"}, {"value": "en_camino", "label": "En Camino", "color": "warning"}, {"value": "entregado", "label": "Entregado", "color": "success"}, {"value": "fallido", "label": "Fallido", "color": "destructive"}]'),
('deliveries', 'driver_name', 'Repartidor', 'text', true, true, false, 5, NULL),
('deliveries', 'driver_phone', 'Tel. Repartidor', 'phone', true, true, false, 6, NULL),
('deliveries', 'assigned_at', 'Asignado', 'date', true, true, false, 7, NULL),
('deliveries', 'delivered_at', 'Entregado', 'date', true, true, false, 8, NULL);

-- ================================================
-- COLUMNAS DEL SISTEMA PARA PRODUCTOS
-- ================================================

INSERT INTO public.table_column_definitions (module_key, column_key, column_name, column_type, is_system, is_visible, is_required, column_order, options) VALUES
('products', 'name', 'Nombre', 'text', true, true, true, 1, NULL),
('products', 'category_name', 'Categoría', 'text', true, true, false, 2, NULL),
('products', 'price', 'Precio', 'number', true, true, true, 3, NULL),
('products', 'stock', 'Stock', 'number', true, true, false, 4, NULL),
('products', 'low_stock_threshold', 'Stock Mínimo', 'number', true, true, false, 5, NULL),
('products', 'is_active', 'Estado', 'status', true, true, false, 6, '[{"value": "true", "label": "Activo", "color": "success"}, {"value": "false", "label": "Inactivo", "color": "muted"}]'),
('products', 'created_at', 'Fecha Creación', 'date', true, true, false, 7, NULL);

-- ================================================
-- TRIGGER PARA UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_column_definitions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_column_definitions_updated
BEFORE UPDATE ON public.table_column_definitions
FOR EACH ROW EXECUTE FUNCTION update_column_definitions_timestamp();

CREATE TRIGGER trigger_system_settings_updated
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION update_column_definitions_timestamp();