import { supabase } from './src/config/supabase.js';

async function checkExternalId() {
    console.log("Checking for 'external_id' column existence and data...");

    const { data, error } = await supabase
        .from('resorts')
        .select('id, name, external_id')
        .ilike('name', '%Club Quarters%');

    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log("Query Results:", data);
        if (data && data.length > 0) {
            const hasId = data[0].external_id;
            console.log(`Resort found. external_id = ${hasId}`);
            if (hasId) {
                console.log("✅ SUCCESS: Column exists and data is populated.");
            } else {
                console.log("⚠️ WARNING: Column exists (query didn't fail) but external_id is NULL.");
            }
        } else {
            console.log("No resort found matching 'Club Quarters'.");
        }
    }
}

checkExternalId();
