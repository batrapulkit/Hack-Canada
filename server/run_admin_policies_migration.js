// Quick script to run the admin agency policies migration
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
    console.log('Running admin agency policies migration...');

    try {
        const migrationSQL = readFileSync(join(__dirname, 'migrations', '20260123_add_admin_agency_policies.sql'), 'utf-8');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { query: migrationSQL });

        if (error) {
            console.log('RPC not available, trying manual SQL execution...');

            // Split SQL into individual statements and execute
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const stmt of statements) {
                console.log(`Executing: ${stmt.substring(0, 60)}...`);
                // Note: Supabase client doesn't support raw SQL execution directly
                // This needs to be run via Supabase dashboard SQL editor
            }

            console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
            console.log('\n' + migrationSQL);
            return;
        }

        console.log('✅ Migration completed successfully!');
        console.log('Super admin users can now update any agency.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:');
        const migrationSQL = readFileSync(join(__dirname, 'migrations', '20260123_add_admin_agency_policies.sql'), 'utf-8');
        console.log('\n' + migrationSQL);
        process.exit(1);
    }
}

runMigration();
