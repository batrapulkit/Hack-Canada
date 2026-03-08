-- Add 'notes' column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS notes TEXT;
