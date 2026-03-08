DO $$ 
BEGIN 
    -- Add external_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resorts' AND column_name = 'external_id') THEN 
        ALTER TABLE resorts ADD COLUMN external_id TEXT UNIQUE; 
    END IF;

    -- Add sentiment_score if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resorts' AND column_name = 'sentiment_score') THEN 
        ALTER TABLE resorts ADD COLUMN sentiment_score FLOAT DEFAULT 0; 
    END IF;

    -- Ensure tags and amenities are arrays (TEXT[])
    -- (This is harder to check safely in one block, assuming they exist as we query them)

END $$;
