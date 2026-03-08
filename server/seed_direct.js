
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const AGENCY_ID = '4fa63a8d-e667-4fce-bb72-509e26c8c50f'; // From debug logs

const seed = async () => {
    console.log("Starting manual seed...");

    // 1. Get Clients
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', AGENCY_ID)
        .limit(10);

    if (clientError || !clients.length) {
        console.error("No clients found", clientError);
        return;
    }

    console.log(`Found ${clients.length} clients.`);

    const quotes = [];
    const destinations = ["Maldives", "Paris", "Tokyo", "Swiss Alps", "Santorini", "Dubai", "New York", "Safari Kenya", "Bora Bora", "Rome"];

    for (let i = 0; i < 10; i++) {
        const client = clients[i % clients.length];
        const dest = destinations[i];
        const total = Math.floor(Math.random() * (15000 - 3000) + 3000);

        quotes.push({
            agency_id: AGENCY_ID,
            client_id: client.id,
            total_price: total, // DB column is total_price
            status: ['draft', 'sent', 'accepted'][Math.floor(Math.random() * 3)],
            valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
            // notes: "Manual Seed" // Skipped to avoid error
        });
    }

    const { data, error } = await supabase
        .from('quotes')
        .insert(quotes)
        .select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log(`Successfully seeded ${data.length} quotes!`);
    }
};

seed();
