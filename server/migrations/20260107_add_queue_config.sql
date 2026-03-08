-- Add amadeus_queue_number column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agency_gds_config' AND column_name = 'amadeus_queue_number') THEN
        ALTER TABLE agency_gds_config ADD COLUMN amadeus_queue_number TEXT DEFAULT '50';
    END IF;
END $$;
