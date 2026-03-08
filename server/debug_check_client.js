
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

const checkClient = async () => {
    console.log("Checking for client 'Snow Monkey Logistics'...");

    // Search case-insensitive
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, full_name, agency_id, email')
        .ilike('full_name', '%Snow Monkey%');

    if (error) {
        console.error("Error searching clients:", error);
    } else {
        if (clients.length === 0) {
            console.log("No client found matching 'Snow Monkey'.");
        } else {
            console.log("Found clients:", clients);
        }
    }
};

checkClient();
