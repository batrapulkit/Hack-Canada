-- Drop CHECK constraint that's blocking subscription plan updates
-- The constraint 'agency_subscription_plan_check' is preventing updates

ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agency_subscription_plan_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agency_subscription_status_check;

-- If you want to add them back with correct values, use:
-- ALTER TABLE agencies ADD CONSTRAINT agency_subscription_plan_check 
--   CHECK (subscription_plan IN ('agency_starter', 'agency_plus', 'agency_pro'));
-- 
-- ALTER TABLE agencies ADD CONSTRAINT agency_subscription_status_check 
--   CHECK (subscription_status IN ('active', 'suspended', 'cancelled'));
