// Run constraint removal migration
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
    console.log('Removing CHECK constraints...');

    const migrationSQL = readFileSync(join(__dirname, 'migrations', '20260123_remove_subscription_constraints.sql'), 'utf-8');

    // Execute using raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(() => ({ error: 'RPC not available' }));

    if (error) {
        console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:\n');
        console.log(migrationSQL);
        return;
    }

    console.log('✅ Constraints removed successfully!');
}

runMigration();
