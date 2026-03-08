import { searchResorts } from './src/services/resortService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('ENV CHECK:', {
    API_KEY_EXISTS: !!(process.env.AMADEUS_API_KEY || process.env.AMADEUS_CLIENT_ID),
    SECRET_EXISTS: !!(process.env.AMADEUS_SECRET || process.env.AMADEUS_CLIENT_SECRET)
});

async function testSearch() {
    console.log('--- STARTING TEST ---');
    try {
        console.log('Calling searchResorts...');
        const results = await searchResorts({ destination: 'Paris' });
        console.log('--- SUCCESS ---');
        console.log('Result count:', results ? results.length : 'NULL');
    } catch (error) {
        console.error('--- FAILURE ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSearch();
