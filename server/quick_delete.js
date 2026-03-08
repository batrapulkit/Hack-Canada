import { supabase } from './src/config/supabase.js';

async function cleanup() {
    const { error } = await supabase.from('resorts').delete().ilike('name', '%Club Quarters%');
    if (!error) console.log("Deleted 'Club Quarters' to allow clean re-import.");
}
cleanup();
