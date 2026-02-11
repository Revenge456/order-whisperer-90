-- Add description column definition for products module
INSERT INTO table_column_definitions (module_key, column_key, column_name, column_type, column_order, is_required, is_system, is_visible)
VALUES ('products', 'description', 'Descripción', 'text', 2, false, true, true);

-- Shift existing columns order to make room
UPDATE table_column_definitions SET column_order = column_order + 1 
WHERE module_key = 'products' AND column_order >= 2 AND column_key != 'description';
