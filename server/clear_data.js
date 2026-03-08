import { supabase } from './src/config/supabase.js';

async function clear() {
    console.log("Clearing Resorts Data...");

    // Delete all resorts (Cascades to Packages)
    const { error } = await supabase
        .from('resorts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
        console.error("Delete Error:", error);
        return;
    }

    console.log("Database Cleared.");
}

clear();
