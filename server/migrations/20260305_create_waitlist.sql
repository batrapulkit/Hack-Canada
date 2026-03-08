-- Migration: Create waitlist table for landing page lead capture
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS waitlist (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   text NOT NULL,
    email       text NOT NULL,
    created_at  timestamp with time zone DEFAULT now()
);

-- Optional: unique constraint to prevent duplicate emails
ALTER TABLE waitlist
    ADD CONSTRAINT waitlist_email_unique UNIQUE (email);

-- Enable Row Level Security (open read/insert for service role)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the backend (service role bypasses RLS)
CREATE POLICY "Allow insert for all" ON waitlist
    FOR INSERT WITH CHECK (true);
