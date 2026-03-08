-- Add RLS policy to allow super_admin users to update any agency
-- This is needed for the master account subscription management feature

-- First, make sure RLS is enabled on agencies table
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Super admins can update any agency" ON agencies;

-- Create policy to allow super_admin role to update any agency
CREATE POLICY "Super admins can update any agency" ON agencies
    FOR UPDATE
    TO authenticated
    USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin');

-- Also ensure super_admins can view all agencies
DROP POLICY IF EXISTS "Super admins can view all agencies" ON agencies;
CREATE POLICY "Super admins can view all agencies" ON agencies
    FOR SELECT
    TO authenticated
    USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin');
