import { supabase } from './src/config/supabase.js';

async function checkRemainingFakePackages() {
    const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('name', 'Standard Best Rate');

    if (error) {
        console.error("Error checking packages:", error);
        return;
    }

    if (packages.length > 0) {
        console.log(`Found ${packages.length} remaining fake packages. Listing sample:`);
        console.log(packages[0]);
    } else {
        console.log("No packages named 'Standard Best Rate' found in the database. Client view might be cached.");
    }
}

checkRemainingFakePackages();
