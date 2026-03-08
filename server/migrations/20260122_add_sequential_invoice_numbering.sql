-- Migration: Add Sequential Invoice Numbering System
-- Date: 2026-01-22
-- Description: Adds invoice_counters table and invoice_prefix column to agencies table

-- Add invoice_prefix column to agencies table (if not exists)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';

-- Create invoice_counters table for sequential numbering
CREATE TABLE IF NOT EXISTS invoice_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agency_id, year)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_counters_agency_year ON invoice_counters(agency_id, year);

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Sequential invoice numbering system migration completed successfully';
END $$;
