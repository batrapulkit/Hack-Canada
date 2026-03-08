import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
    const { data: users, error } = await supabase.from('users').select('id, email, role, status');
    fs.writeFileSync('users_db.json', JSON.stringify(users, null, 2));
    console.log("Written accounts to users_db.json");
}

listUsers();
