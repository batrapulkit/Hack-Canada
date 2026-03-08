
import { supabase } from './src/config/supabase.js';

async function test() {
    console.log("Testing exec_sql RPC...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    if (error) {
        console.log("RPC Error:", error.message);
    } else {
        console.log("RPC Success:", data);
    }
}

test();
