import { supabase } from './src/config/supabase.js';

async function debugRecent() {
    console.log("Listing top 5 most recent resorts...");

    const { data: resorts, error } = await supabase
        .from('resorts')
        .select('id, name, created_at, external_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(JSON.stringify(resorts, null, 2));
    }
}

debugRecent();
