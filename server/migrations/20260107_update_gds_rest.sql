-- Migration: Update GDS Config for REST and Add Sync Support

-- 1. Update agency_gds_config to support REST credentials
ALTER TABLE agency_gds_config
DROP COLUMN IF EXISTS amadeus_oid,
DROP COLUMN IF EXISTS amadeus_originator,
DROP COLUMN IF EXISTS amadeus_password_hash,
DROP COLUMN IF EXISTS amadeus_queue_number,
ADD COLUMN IF NOT EXISTS amadeus_client_id TEXT,
ADD COLUMN IF NOT EXISTS amadeus_client_secret TEXT,
ADD COLUMN IF NOT EXISTS amadeus_environment TEXT DEFAULT 'test'; -- test or production

-- 2. Add Sync Columns to Bookings Table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS amadeus_booking_id TEXT, -- The unique ID from Amadeus (e.g., flight-order ID)
ADD COLUMN IF NOT EXISTS pnr_reference TEXT,     -- The 6-char record locator
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS raw_gds_data JSONB;      -- Store full JSON for debugging/reference

-- Index for fast lookups during sync
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_amadeus_id ON bookings(amadeus_booking_id);
