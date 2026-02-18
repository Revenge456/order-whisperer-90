
-- Allow authenticated users to insert messages into whatsapp_logs
CREATE POLICY "Allow authenticated insert on whatsapp_logs"
ON public.whatsapp_logs
FOR INSERT
WITH CHECK (true);

-- Update default chat_status from 'abierto' to 'revision'
ALTER TABLE public.customers ALTER COLUMN chat_status SET DEFAULT 'revision';

-- Migrate any remaining 'abierto' values to 'revision' 
-- and 'cerrado' to 'bueno' (cleanup from previous states)
UPDATE public.customers SET chat_status = 'revision' WHERE chat_status = 'abierto';
UPDATE public.customers SET chat_status = 'bueno' WHERE chat_status = 'cerrado';
