
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAccess() {
    console.log("Testing DB Access with Service Role Key...");

    // 1. Get an agency to attach to
    const { data: agencies, error: agencyError } = await supabase.from('agencies').select('id').limit(1);
    if (agencyError) {
        console.error("Failed to fetch agencies:", agencyError);
        return;
    }
    if (!agencies || agencies.length === 0) {
        console.error("No agencies found. Cannot test GDS config.");
        return;
    }
    const agencyId = agencies[0].id;
    console.log("Using Agency ID:", agencyId);

    // 2. Try to Upsert GDS Config
    const payload = {
        agency_id: agencyId,
        amadeus_oid: 'TEST_SCRIPT',
        amadeus_originator: 'TEST_SCRIPT',
        sync_status: 'test'
    };

    const { data, error } = await supabase
        .from('agency_gds_config')
        .upsert(payload, { onConflict: 'agency_id' })
        .select();

    if (error) {
        console.error("UPSERT FAILED:", error);
    } else {
        console.log("UPSERT SUCCESS:", data);

        // Cleanup?
        // await supabase.from('agency_gds_config').delete().eq('agency_id', agencyId);
    }
}

testAccess();
