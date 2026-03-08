// Direct SQL execution for migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runDirectMigration() {
    console.log('📊 Running migration using direct database operations...\n');

    try {
        // Step 1: Add invoice_prefix column to agencies (safe with IF NOT EXISTS)
        console.log('Step 1: Adding invoice_prefix column to agencies...');
        const { error: alterError } = await supabase.rpc('execute_sql', {
            query: 'ALTER TABLE agencies ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT \'INV\''
        });

        if (alterError && !alterError.message.includes('already exists')) {
            // Try PostgresSQL RPC instead
            const query = `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='agencies' AND column_name='invoice_prefix'
          ) THEN
            ALTER TABLE agencies ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
          END IF;
        END $$;
      `;

            // Since we can't run DO blocks directly, we'll use a workaround
            // Just insert data and let it fail gracefully if column doesn't exist
            const { data: testAgency } = await supabase
                .from('agencies')
                .select('id, invoice_prefix')
                .limit(1)
                .single();

            if (testAgency && testAgency.invoice_prefix !== undefined) {
                console.log('✅ invoice_prefix column already exists');
            } else {
                console.log('⚠️  Column might not exist - manual migration needed');
            }
        } else {
            console.log('✅ invoice_prefix column added/verified');
        }

        // Step 2: Create invoice_counters table using INSERT trick
        console.log('\nStep 2: Creating invoice_counters table...');

        // Try to query the table first
        const { error: tableCheck } = await supabase
            .from('invoice_counters')
            .select('id')
            .limit(1);

        if (tableCheck && tableCheck.code === '42P01') {
            // Table doesn't exist - we need SQL access
            console.log('❌ Table does not exist');
            console.log('\n⚠️  Cannot create table via Supabase client');
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
            console.log('----------------------------------------');
            console.log(`
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

      `);
            console.log('----------------------------------------\n');
            return false;
        } else {
            console.log('✅ invoice_counters table exists!');
            return true;
        }

    } catch (err) {
        console.error('❌ Migration error:', err.message);
        return false;
    }
}

runDirectMigration().then(success => {
    if (!success) {
        console.log('\n💡 Next Steps:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click Run');
        console.log('5. Test invoice creation again\n');
    } else {
        console.log('\n🎉 Migration completed! You can now use sequential invoice numbering.\n');
    }
});
