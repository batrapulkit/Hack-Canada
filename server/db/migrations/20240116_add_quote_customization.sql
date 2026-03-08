-- Add custom fields to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS title text DEFAULT 'Proposal',
ADD COLUMN IF NOT EXISTS introduction text,
ADD COLUMN IF NOT EXISTS header_text text, -- For Terms or Header info
ADD COLUMN IF NOT EXISTS footer_text text; -- For Footer notes
