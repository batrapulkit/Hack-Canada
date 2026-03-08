import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log("Starting duplicate cleanup...");

    // 1. Fetch all suppliers
    const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching suppliers:", error);
        return;
    }

    console.log(`Found ${suppliers.length} total suppliers.`);

    // 2. Group by name and agency_id
    const groups = {};
    suppliers.forEach(s => {
        const key = `${s.agency_id}_${s.name.toLowerCase()}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(s);
    });

    // 3. Identify duplicates to delete
    const toDelete = [];
    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            console.log(`Found duplicate group for '${group[0].name}': ${group.length} entries.`);
            // Keep the first one (most recent due to sort), delete the rest
            const duplicates = group.slice(1);
            duplicates.forEach(d => toDelete.push(d.id));
        }
    }

    if (toDelete.length === 0) {
        console.log("No duplicates found.");
        return;
    }

    console.log(`Deleting ${toDelete.length} duplicate entries...`);

    // 4. Delete duplicates
    const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .in('id', toDelete);

    if (deleteError) {
        console.error("Error deleting duplicates:", deleteError);
    } else {
        console.log("Successfully cleaned up duplicates.");
    }
}

cleanupDuplicates();
