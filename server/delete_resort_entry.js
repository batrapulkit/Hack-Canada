import { supabase } from './src/config/supabase.js';

async function deleteResort() {
    console.log("Deleting 'Club Quarters' resort...");

    // Using ilike for safety check first
    const { data: found } = await supabase.from('resorts').select('id, name').ilike('name', '%Club Quarters%');

    if (found && found.length > 0) {
        console.log(`Found ${found.length} matching resorts.`);
        for (const r of found) {
            console.log(`Deleting: ${r.name} (${r.id})`);
            const { error } = await supabase.from('resorts').delete().eq('id', r.id);
            if (error) console.error("Error deleting:", error);
            else console.log("Deleted successfully.");
        }
    } else {
        console.log("No matching resorts found to delete.");
    }
}

deleteResort();
