-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_name TEXT NOT NULL,
  contact_email TEXT,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'agent',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a view for user_profiles if it's expected by some queries
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE OR REPLACE VIEW user_profiles AS
SELECT id, name as full_name, email, agency_id FROM users;

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  passport_number TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  budget_range TEXT,
  notes TEXT,
  vip_status BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  duration INTEGER,
  budget TEXT,
  travelers INTEGER DEFAULT 1,
  interests JSONB DEFAULT '[]'::jsonb,
  accommodation_type TEXT,
  ai_generated_content TEXT,
  ai_generated_json JSONB,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table (Placeholder)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Other', -- Hotel, Airline, DMC, etc.
  email TEXT,
  website_url TEXT,
  logo_url TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  api_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  booking_type TEXT, -- Flight, Hotel, Activity, Transfer, Car
  booking_status TEXT DEFAULT 'pending', -- pending, confirmed, ticketed, cancelled
  confirmation_number TEXT,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  travel_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  sell_price DECIMAL(10, 2) DEFAULT 0,
  commission DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
  invoice_number TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, void, overdue
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax_total DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  amount DECIMAL(10, 2) DEFAULT 0,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage Buckets (if not exists)
-- Note: This usually needs to be done via Supabase UI or API, SQL might not work for storage buckets directly depending on permissions.
-- INSERT INTO storage.buckets (id, name) VALUES ('agency-logos', 'agency-logos') ON CONFLICT DO NOTHING;

-- Itinerary Pricing Items Table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('percentage', 'flat')),
  markup_value DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) DEFAULT 0,
  
  activity_type TEXT DEFAULT 'other',
  currency TEXT DEFAULT 'USD',
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_agency ON itinerary_items(agency_id);

-- Enable Row Level Security
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow full access to users within the same agency
CREATE POLICY "Agency Access Policy" ON itinerary_items
    FOR ALL
    TO authenticated
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Invoice Counters Table (for sequential invoice numbering)
CREATE TABLE IF NOT EXISTS invoice_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agency_id, year)
);

CREATE INDEX IF NOT EXISTS idx_invoice_counters_agency_year ON invoice_counters(agency_id, year);

