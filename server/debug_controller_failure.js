import { search } from './src/controllers/resortController.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const req = {
    query: {
        destination: 'Paris' // Testing a city likely to trigger Amadeus
    }
};

const res = {
    status: (code) => {
        console.log('Response Status:', code);
        return {
            json: (data) => {
                console.log('Response Error JSON:', data);
            }
        };
    },
    json: (data) => {
        console.log('Response Success JSON (Count):', data ? data.length : 'null');
        if (data && data.length > 0) console.log('First Item:', data[0].name);
    }
};

async function run() {
    console.log('Invoking resortController.search...');
    try {
        await search(req, res);
    } catch (e) {
        console.error('Controller threw unhandled error:', e);
    }
}

run();
