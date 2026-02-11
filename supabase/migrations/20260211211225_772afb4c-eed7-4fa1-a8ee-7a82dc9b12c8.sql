
-- Add 'canal' column to customers
ALTER TABLE public.customers ADD COLUMN canal text DEFAULT NULL;

-- Add 'chat_status' column to customers (abierto/cerrado)
ALTER TABLE public.customers ADD COLUMN chat_status text NOT NULL DEFAULT 'abierto';

-- Add column definition for 'canal' in dynamic table
INSERT INTO table_column_definitions (module_key, column_key, column_name, column_type, column_order, is_required, is_system, is_visible, options)
VALUES ('customers', 'canal', 'Canal', 'select', 3, false, false, true, 
  '[{"value":"facebook_ads","label":"Facebook Ads","color":"primary"},{"value":"whatsapp","label":"WhatsApp","color":"success"},{"value":"instagram","label":"Instagram","color":"warning"},{"value":"referido","label":"Referido","color":"muted"},{"value":"organico","label":"Orgánico","color":"muted"},{"value":"otro","label":"Otro","color":"muted"}]'::jsonb
);
