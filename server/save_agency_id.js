
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function saveAgencyId() {
    const { data: agencies, error } = await supabase.from('agencies').select('id').limit(1);
    if (error || !agencies || agencies.length === 0) {
        console.error("Error or no agencies:", error);
    } else {
        const id = agencies[0].id;
        fs.writeFileSync('agency_id.txt', id);
        console.log("Saved Agency ID:", id);
    }
}

saveAgencyId();
