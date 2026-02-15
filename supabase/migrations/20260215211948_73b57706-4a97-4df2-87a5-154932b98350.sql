-- Update existing chat_status values to new classification
UPDATE public.customers SET chat_status = 'ai' WHERE chat_status = 'abierto';
-- 'cerrado' values stay as-is, we'll map them to 'bueno' below
UPDATE public.customers SET chat_status = 'bueno' WHERE chat_status = 'cerrado';

-- Also update conversation_mode based on new status where needed
UPDATE public.customers SET conversation_mode = 'ai' WHERE chat_status = 'ai';
UPDATE public.customers SET conversation_mode = 'manual' WHERE chat_status IN ('revision', 'bueno', 'venta');