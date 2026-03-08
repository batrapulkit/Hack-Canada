import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Trying fallback env path...');
    dotenv.config({ path: path.resolve(__dirname, '.env') });
}

if (!process.env.SUPABASE_URL) {
    console.error('Missing Supabase credentials. env loaded:', process.env.SUPABASE_URL ? 'YES' : 'NO');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkImage() {
    const { data, error } = await supabase
        .from('resorts')
        .select('id, name, image_url')
        .ilike('name', '%Moon Palace%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Resort Data:', JSON.stringify(data, null, 2));
    }
}

checkImage();
