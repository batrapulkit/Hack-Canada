
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkItineraryFetch() {
    console.log('--- Checking Itinerary Fetch ---');

    const testId = '3e71bf3e-321c-448f-a7a3-8b17ccc06039';
    console.log(`Testing with itinerary ID: ${testId}`);

    // 2. Try the manual join pattern (mimicking the new fix)
    const { data: itinerary, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', testId)
        .single();

    if (error) {
        console.error('❌ Error fetching itinerary (base):', error);
    } else {
        console.log('✅ Successfully fetched itinerary base!');
        console.log('ITINERARY DATA:', JSON.stringify(itinerary, null, 2));

        // Check Invoices Manual Fetch
        console.log(`Fetching invoices for itinerary ${itinerary.id}...`);
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('*')
            .eq('itinerary_id', itinerary.id);

        if (invError) {
            console.error('❌ Error fetching invoices:', invError);
        } else {
            console.log(`✅ Successfully fetched ${invoices.length} invoices.`);
        }

        // Check Bookings Manual Fetch
        console.log(`Fetching bookings for itinerary ${itinerary.id}...`);
        const { data: bookings, error: bookError } = await supabase
            .from('bookings')
            .select('*, supplier:suppliers(name)') // Embed supplier inside bookings might still work if FK bookings->supplier exists? Hopefully.
            .eq('itinerary_id', itinerary.id);

        if (bookError) {
            console.error('❌ Error fetching bookings:', bookError);
        } else {
            console.log(`✅ Successfully fetched ${bookings.length} bookings.`);
        }
    }

    if (itinerary.created_by) {
        console.log(`Fetching user ${itinerary.created_by}...`);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', itinerary.created_by)
            .single();

        if (userError) {
            console.error('❌ Error fetching user:', userError);
        } else {
            console.log('✅ Successfully fetched linked user:', user);
        }
    } else {
        console.log('Itinerary has no created_by user.');
    }
}



async function checkForeignKeys() {
    console.log('\n--- Checking Foreign Keys for "itineraries" ---');
    // We can't easily query information_schema via supabase-js unless we have a straight SQL helper or rpc.
    // Assuming we might not have a direct SQL runner enabled for non-admin, but let's try assuming service role can maybe do it purely via introspection if possible? 
    // Actually, supabase-js doesn't expose raw SQL execution easily without an RPC.

    // Attempting to infer from PostgREST error is usually enough.
    // But let's verify if `created_by` column exists.

    const { data, error } = await supabase
        .from('itineraries')
        .select('created_by')
        .limit(1);

    if (error) {
        console.error('Error selecting created_by:', error);
    } else {
        console.log('Column created_by exists on itineraries table.');
        if (data.length > 0) {
            console.log('Sample created_by value:', data[0].created_by);
        }
    }
}

async function run() {
    await checkForeignKeys();
    await checkItineraryFetch();
}

run();
