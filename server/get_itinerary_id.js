import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function getItinerary() {
    const { data, error } = await supabase.from('itineraries').select('id').limit(1).single();
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(data.id);
    }
}

getItinerary();
