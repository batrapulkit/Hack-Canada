-- Add GDS Configuration to Agencies
-- We'll use a separate table to keep security credentials isolated and allow for future expansion

CREATE TABLE IF NOT EXISTS agency_gds_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Amadeus Enterprise Credentials
  amadeus_oid TEXT,               -- Office ID
  amadeus_originator TEXT,        -- Originator (e.g. WS user)
  amadeus_password_hash TEXT,     -- Encrypted/Hashed password for WS-Security (managed by app)
  amadeus_queue_number TEXT,      -- Queue to scan (e.g. '50')
  amadeus_ws_url TEXT DEFAULT 'https://nodeD1.test.webservices.amadeus.com', -- Default to test, user can override
  
  -- Sync State
  last_queue_scan_time TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'inactive', -- active, error, inactive
  sync_error_log TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT uq_agency_gds_config_agency_id UNIQUE (agency_id)
);

-- RLS Policies
ALTER TABLE agency_gds_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency Config Access" ON agency_gds_config
    FOR ALL
    TO authenticated
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
