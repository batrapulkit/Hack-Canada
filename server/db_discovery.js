
import { supabase } from './src/config/supabase.js';

async function listTables() {
    console.log("Listing Tables matching 'itinerary'...");

    // Supabase-js doesn't give direct access to information_schema easily via .from() usually, 
    // unless exposes it. But often public.tables is accessible via RPC or if mapped.
    // However, normal supabase client queries 'public' schema by default.
    // Try to list all tables? No.

    // Try 'itinerary_items' (plural) ? We did.
    // Try 'itinerary_item' (singular)
    // Try 'items'

    const candidates = ['agencies', 'itineraries', 'itinerary_items'];

    for (const table of candidates) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
            console.log(`✅ Table Found: ${table}`);
        } else {
            console.log(`❌ Table Check Failed: ${table} (${error.message})`);
        }
    }
}

listTables();
