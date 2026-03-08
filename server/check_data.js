import { supabase } from './src/config/supabase.js';

async function checkData() {
    console.log("Checking Resorts Data...");

    // Check Resorts without Amenities
    const { data: resorts, error } = await supabase
        .from('resorts')
        .select('id, name, amenities')
        .limit(100);

    if (error) {
        console.error("Error fetching resorts:", error);
        return;
    }

    console.log(`Found ${resorts.length} resorts.`);
    resorts.forEach(r => {
        if (!r.amenities || r.amenities.length === 0) {
            console.log(`[WARNING] Resort '${r.name}' has NO amenities.`);
        } else {
            // console.log(`[OK] Resort '${r.name}' has ${r.amenities.length} amenities.`);
        }
    });

    // Check Packages count
    const { data: packages, error: pError } = await supabase
        .from('packages')
        .select('resort_id');

    if (pError) {
        console.error("Error fetching packages:", pError);
        return;
    }

    const pkgCounts = {};
    packages.forEach(p => {
        pkgCounts[p.resort_id] = (pkgCounts[p.resort_id] || 0) + 1;
    });

    resorts.forEach(r => {
        if (!pkgCounts[r.id]) {
            console.log(`[WARNING] Resort '${r.name}' has NO packages.`);
        }
    });
}

checkData();
