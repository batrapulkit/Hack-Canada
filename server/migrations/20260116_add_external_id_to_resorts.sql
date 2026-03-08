-- Add external_id column to resorts table to store Amadeus Hotel ID
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_resorts_external_id ON resorts(external_id);
