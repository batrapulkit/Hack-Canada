// Simple test for invoice number generator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    try {
        // Get first agency
        const { data: agencies } = await supabase.from('agencies').select('id').limit(1);
        const agencyId = agencies[0].id;
        const currentYear = new Date().getFullYear();

        console.log('Agency ID:', agencyId);
        console.log('Year:', currentYear);

        // Test query
        const { data: counter, error } = await supabase
            .from('invoice_counters')
            .select('*')
            .eq('agency_id', agencyId)
            .eq('year', currentYear)
            .single();

        if (error) {
            console.log('\nERROR:', error.message);
            console.log('Code:', error.code);
            console.log('Details:', error.details);
            console.log('Hint:', error.hint);
        } else {
            console.log('\nCounter found:', counter);
        }

        // Try to insert
        console.log('\n--- Attempting INSERT ---');
        const { data: newCounter, error: insertError } = await supabase
            .from('invoice_counters')
            .insert({
                agency_id: agencyId,
                year: currentYear,
                last_number: 1
            })
            .select()
            .single();

        if (insertError) {
            console.log('INSERT ERROR:', insertError.message);
            console.log('Code:', insertError.code);
        } else {
            console.log('INSERT SUCCESS:', newCounter);
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

test();
