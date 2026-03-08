
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const id = '3e71bf3e-321c-448f-a7a3-8b17ccc06039';
    let output = `Checking Itinerary: ${id}\n`;

    const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        output += `Error: ${JSON.stringify(error)}\n`;
        fs.writeFileSync('debug_itinerary.txt', output);
        return;
    }

    output += `Duration: ${data.duration}\n`;
    output += `Travelers: ${data.travelers}\n`;
    output += `Destination: ${data.destination}\n`;

    if (data.ai_generated_json) {
        output += `AI JSON Keys: ${Object.keys(data.ai_generated_json).join(', ')}\n`;
        output += `Summary (first 100 chars): ${String(data.ai_generated_json.summary).slice(0, 100)}\n`;
        output += `Description: ${data.ai_generated_json.description}\n`;
    } else {
        output += 'AI JSON is null/empty\n';
    }

    // Also check raw content string
    output += `AI Content String (type): ${typeof data.ai_generated_content}\n`;

    fs.writeFileSync('debug_itinerary.txt', output);
    console.log('Written to debug_itinerary.txt');
}

run();
