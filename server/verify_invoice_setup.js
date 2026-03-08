// Verify sequential invoice numbering setup
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySetup() {
    console.log('🔍 Verifying sequential invoice numbering setup...\n');

    try {
        // Check invoice_counters table
        const { data: counters, error: counterError } = await supabase
            .from('invoice_counters')
            .select('*');

        if (counterError) {
            console.error('❌ invoice_counters table check failed:', counterError.message);
            console.log('\n⚠️  The table might not exist. Run the migration script first.');
            return;
        }

        console.log('✅  invoice_counters table exists');
        console.log(`   Current counters: ${counters?.length || 0}`);
        if (counters?.length > 0) {
            counters.forEach(c => {
                console.log(`   - Agency: ${c.agency_id}, Year: ${c.year}, Last Number: ${c.last_number}`);
            });
        }

        // Check agencies invoice_prefix column
        const { data: agencies, error: agencyError } = await supabase
            .from('agencies')
            .select('id, agency_name, invoice_prefix');

        if (agencyError) {
            console.error('\n❌ Error fetching agencies:', agencyError.message);
            if (agencyError.message.includes('invoice_prefix')) {
                console.log('\n⚠️  invoice_prefix column might not exist. Run the migration script.');
            }
            return;
        }

        console.log(`\n✅ Agencies with invoice prefix (${agencies?.length || 0}):`);
        agencies?.forEach(a => {
            console.log(`   - ${a.agency_name}: prefix="${a.invoice_prefix || 'INV (default)'}"`);
        });

        console.log('\n✅ Setup verification complete!');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    }
}

verifySetup();
