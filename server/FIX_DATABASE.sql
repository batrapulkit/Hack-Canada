-- =========================================================
-- FIX: MISSING TABLE 'itinerary_items'
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- =========================================================

-- 1. Create the table
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
  
  -- Extra fields usually needed for sorting/frontend logic
  day INTEGER DEFAULT 1,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Indexes for speed
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_agency ON itinerary_items(agency_id);

-- 3. Enable Security
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- 4. Create Access Policy (So you can actually write to it)
DROP POLICY IF EXISTS "Agency Access Policy" ON itinerary_items;
CREATE POLICY "Agency Access Policy" ON itinerary_items
    FOR ALL
    TO authenticated
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- =========================================================
-- AFTER RUNNING THIS, THE "FAILED TO ADD ITEM" ERROR WILL GO AWAY
-- =========================================================
