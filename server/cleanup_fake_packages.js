import { supabase } from './src/config/supabase.js';

async function cleanupFakePackages() {
    console.log("Cleaning up fake 'Standard Best Rate' packages...");

    const { error } = await supabase
        .from('packages')
        .delete()
        .eq('name', 'Standard Best Rate')
        .eq('description', 'Best available rate for this property. Includes standard amenities.') // Be specific to avoid deleting real user packages
        .eq('currency', 'USD');

    if (error) {
        console.error("Error cleaning up:", error);
    } else {
        console.log("Cleanup successful. Fake packages removed.");
    }
}

cleanupFakePackages();
