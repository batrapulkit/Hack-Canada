import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    console.log("Testing insert for pulkit.cr7@gmail.com...");
    const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ email: 'pulkit.cr7@gmail.com', status: 'active', role: 'agent', password_hash: 'AUTH0_OAUTH' }])
        .select('*, agencies(*)')
        .single();

    fs.writeFileSync('insert_error.json', JSON.stringify(createError || newUser, null, 2));
    console.log("Wrote error to insert_error.json");
}

testInsert();
