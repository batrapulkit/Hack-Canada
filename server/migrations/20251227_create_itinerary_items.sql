-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('percentage', 'flat')),
  markup_value DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) DEFAULT 0,
  
  activity_type TEXT DEFAULT 'other',
  currency TEXT DEFAULT 'USD',
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_agency ON itinerary_items(agency_id);

-- Enable Row Level Security
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow full access to users within the same agency
CREATE POLICY "Agency Access Policy" ON itinerary_items
    FOR ALL
    TO authenticated
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
