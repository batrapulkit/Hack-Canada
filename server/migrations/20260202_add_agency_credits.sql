-- Add credits_balance column to agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Optional: Add a comment
COMMENT ON COLUMN agencies.credits_balance IS 'Available credits for the agency to use for premium features';
