
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getAgencyId() {
    const { data: user, error } = await supabase.from('users')
        .select('agency_id')
        .eq('email', 'demo@triponic.com')
        .single();

    if (error || !user) {
        console.error("Error or no user:", error);
    } else {
        const id = user.agency_id;
        fs.writeFileSync('agency_id.txt', id);
        console.log("Saved Agency ID for demo@triponic.com:", id);
    }
}

getAgencyId();
