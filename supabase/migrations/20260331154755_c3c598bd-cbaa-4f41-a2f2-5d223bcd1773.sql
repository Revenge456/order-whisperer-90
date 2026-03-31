-- Drop existing broadcast tables
DROP TABLE IF EXISTS broadcast_media CASCADE;
DROP TABLE IF EXISTS broadcast_contacts CASCADE;
DROP TABLE IF EXISTS broadcast_campaigns CASCADE;

-- Create new broadcast_campaigns table
CREATE TABLE broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'pdf')),
  message TEXT,
  pdf_url TEXT,
  pdf_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create new broadcast_contacts table
CREATE TABLE broadcast_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  store TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Critical index for n8n loop filtering
CREATE INDEX idx_broadcast_contacts_campaign_phone 
  ON broadcast_contacts(campaign_id, phone);

-- Enable RLS
ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all for authenticated users
CREATE POLICY "service_role_all" ON broadcast_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON broadcast_contacts FOR ALL USING (true) WITH CHECK (true);