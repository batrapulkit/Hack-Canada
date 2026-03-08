-- 1. Add credits to agencies table (Default 5 free)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS itinerary_credits INTEGER DEFAULT 5;

-- 2. Create Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    credits_value INTEGER NOT NULL, -- How many credits it gives
    max_uses INTEGER DEFAULT 1, -- How many times total it can be used (global)
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Track Coupon Redemptions (Agency x Coupon)
CREATE TABLE IF NOT EXISTS agency_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, coupon_id) -- Prevent double redemption of same coupon
);

-- 4. Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_coupons ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Coupons: readable by everyone (to check validity), writable only by admin (manual DB for now)
CREATE POLICY "Public read coupons" ON coupons FOR SELECT TO authenticated USING (true);

-- Agency Coupons: Agency can see their own redemptions
CREATE POLICY "Agency see own redemptions" ON agency_coupons 
    FOR ALL 
    TO authenticated 
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));


-- 6. SEED DATA (The "More Coupons" requested)
INSERT INTO coupons (code, credits_value, max_uses) VALUES 
('WELCOME10', 10, 999999), -- Unlimited uses, 10 credits
('LAUNCH2025', 20, 999999), -- Launch special, 20 credits
('VIP50', 50, 100)          -- Limited, 50 credits
ON CONFLICT (code) DO NOTHING;
