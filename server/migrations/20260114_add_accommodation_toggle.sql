-- Add include_accommodation column to itineraries table
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS include_accommodation BOOLEAN DEFAULT TRUE;
