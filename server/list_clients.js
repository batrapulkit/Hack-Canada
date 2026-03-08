
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Use service key to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials (SERVICE KEY required)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const listClients = async () => {
    console.log("Listing clients...");

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .limit(20);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${clients.length} clients:`);
        clients.forEach(c => console.log(`- ${c.full_name} (ID: ${c.id}) (Agency: ${c.agency_id})`));
    }
};

listClients();
