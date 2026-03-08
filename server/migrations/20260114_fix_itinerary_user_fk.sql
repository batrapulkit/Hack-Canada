-- Fix missing FK for itineraries -> users (created_by)
-- This ensures PostgREST can detect the relationship for embedding
DO $$
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'itineraries_created_by_fkey'
        AND table_name = 'itineraries'
    ) THEN
        ALTER TABLE itineraries
        ADD CONSTRAINT itineraries_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END $$;
