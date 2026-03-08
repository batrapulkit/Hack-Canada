
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAgencies() {
    console.log("Listing Agencies...");
    const { data: agencies, error } = await supabase.from('agencies').select('id');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Agencies:", agencies);
    }
}

listAgencies();
