-- Create resorts table for AI Ranking Engine
CREATE TABLE IF NOT EXISTS resorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb, -- List of strings: ["Pool", "Kids Club", "Adult Only"]
    tags JSONB DEFAULT '[]'::jsonb,      -- AI/Manual tags: ["luxury", "honeymoon", "family"]
    price_level INTEGER DEFAULT 2,       -- 1=Budget, 2=Moderate, 3=High, 4=Luxury
    rating NUMERIC(2, 1) DEFAULT 0.0,    -- 0.0 to 5.0
    sentiment_score NUMERIC(3, 2) DEFAULT 0.0, -- -1.0 to 1.0 (Derived from reviews)
    image_url TEXT,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE, -- Optional: if private to agency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_resorts_location ON resorts(location);
CREATE INDEX IF NOT EXISTS idx_resorts_tags ON resorts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_resorts_amenities ON resorts USING GIN (amenities);
