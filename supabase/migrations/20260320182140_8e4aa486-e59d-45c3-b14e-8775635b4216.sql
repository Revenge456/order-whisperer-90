
-- Broadcast campaigns table
CREATE TABLE public.broadcast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  message text NOT NULL DEFAULT '',
  status varchar NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed', 'cancelled')),
  total_contacts integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  webhook_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Broadcast contacts table
CREATE TABLE public.broadcast_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  name varchar,
  phone varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Broadcast media table
CREATE TABLE public.broadcast_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  file_name varchar NOT NULL,
  file_url text NOT NULL,
  file_type varchar NOT NULL,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for broadcast_campaigns
CREATE POLICY "Authenticated can read campaigns" ON public.broadcast_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert campaigns" ON public.broadcast_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update campaigns" ON public.broadcast_campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete campaigns" ON public.broadcast_campaigns FOR DELETE TO authenticated USING (true);

-- RLS policies for broadcast_contacts
CREATE POLICY "Authenticated can read contacts" ON public.broadcast_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contacts" ON public.broadcast_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contacts" ON public.broadcast_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete contacts" ON public.broadcast_contacts FOR DELETE TO authenticated USING (true);

-- RLS policies for broadcast_media
CREATE POLICY "Authenticated can read media" ON public.broadcast_media FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert media" ON public.broadcast_media FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete media" ON public.broadcast_media FOR DELETE TO authenticated USING (true);

-- Storage bucket for broadcast media
INSERT INTO storage.buckets (id, name, public) VALUES ('broadcast-media', 'broadcast-media', true);

-- Storage policies
CREATE POLICY "Authenticated can upload broadcast media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'broadcast-media');
CREATE POLICY "Anyone can read broadcast media" ON storage.objects FOR SELECT USING (bucket_id = 'broadcast-media');
CREATE POLICY "Authenticated can delete broadcast media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'broadcast-media');

-- Indexes
CREATE INDEX idx_broadcast_contacts_campaign ON public.broadcast_contacts(campaign_id);
CREATE INDEX idx_broadcast_contacts_status ON public.broadcast_contacts(campaign_id, status);
CREATE INDEX idx_broadcast_media_campaign ON public.broadcast_media(campaign_id);

-- Updated_at trigger
CREATE TRIGGER update_broadcast_campaigns_updated_at
  BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
