import { supabase } from './src/config/supabase.js';

async function forceCleanup() {
    console.log("Force cleaning ALL 'Standard Best Rate' packages...");

    const { error, count } = await supabase
        .from('packages')
        .delete({ count: 'exact' })
        .eq('name', 'Standard Best Rate');

    if (error) {
        console.error("Error cleaning up:", error);
    } else {
        console.log(`Cleanup successful. Deleted packages.`);
    }
}

forceCleanup();
