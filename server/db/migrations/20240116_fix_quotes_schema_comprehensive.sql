-- 1. Add fields to 'quotes' table if they don't exist
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Proposal';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS introduction TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS header_text TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- 2. Create 'quote_items' table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    amount NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add 'invoice_template_url' to 'agencies'
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS invoice_template_url TEXT;

-- 4. Enable RLS on 'quote_items' and 'agencies' (if not already)
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies for 'quote_items'
-- Allow read/write for users belonging to the same agency as the quote
CREATE POLICY "Users can manage quote items for their agency's quotes" ON quote_items
    USING (
        quote_id IN (
            SELECT id FROM quotes WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
        )
    )
    WITH CHECK (
        quote_id IN (
            SELECT id FROM quotes WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
        )
    );

-- 6. Add policy for 'agencies' update if needed (often already exists, but for template url)
CREATE POLICY "Users can update their own agency" ON agencies
    FOR UPDATE USING (
        id = (SELECT agency_id FROM users WHERE id = auth.uid())
    );
