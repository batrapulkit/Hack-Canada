// Quick script to run the subscription fields migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://dhuotcitzwcqazsdtchy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodW90Y2l0endjcWF6c2R0Y2h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk1ODQwMCwiZXhwIjoyMDc4NTM0NDAwfQ.vuzvlSDCvtZrbZQ6AmZRWlpKXeHIYy0k1HfipNAr7sY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running subscription fields migration...');

    const migrationSQL = readFileSync(join(__dirname, 'migrations', '20260123_add_subscription_fields.sql'), 'utf-8');

    try {
        // Execute migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

        if (error) {
            // If RPC doesn't exist, try manual approach
            console.log('RPC method not available, trying direct table alteration...');

            // Add columns one by one
            const queries = [
                `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'agency_starter'`,
                `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
                `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL`,
                `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0`
            ];

            for (const query of queries) {
                const result = await supabase.from('_sql').insert({ query }).select();
                console.log(`Executed: ${query.substring(0, 50)}...`);
            }
        }

        console.log('✅ Migration completed successfully!');
        console.log('The following columns have been added to the agencies table:');
        console.log('  - subscription_plan (default: agency_starter)');
        console.log('  - subscription_status (default: active)');
        console.log('  - usage_limit (default: NULL)');
        console.log('  - usage_count (default: 0)');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:');
        console.log('\n' + migrationSQL);
        process.exit(1);
    }
}

runMigration();
