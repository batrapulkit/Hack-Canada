-- Migration: Add Subscription Management Fields to Agencies Table
-- Date: 2026-01-23
-- Description: Adds subscription_plan, subscription_status, usage_limit, and usage_count columns

-- Add subscription_plan column (starter, plus, pro)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'agency_starter';

-- Add subscription_status column (active, suspended, cancelled)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add usage_limit column (for API/feature limits, NULL = unlimited)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL;

-- Add usage_count column (current month usage tracking)
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN agencies.subscription_plan IS 'Subscription tier: agency_starter, agency_plus, or agency_pro';
COMMENT ON COLUMN agencies.subscription_status IS 'Account status: active, suspended, or cancelled';
COMMENT ON COLUMN agencies.usage_limit IS 'Maximum allowed API calls or feature usage per month (NULL = unlimited)';
COMMENT ON COLUMN agencies.usage_count IS 'Current month usage count, reset monthly';
