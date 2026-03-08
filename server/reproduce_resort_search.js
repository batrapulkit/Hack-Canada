import { searchResorts } from './src/services/resortService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testSearch() {
    console.log('Testing searchResorts("Paris")...');
    try {
        const results = await searchResorts({ destination: 'Paris' });
        console.log('Result count:', results.length);
        if (results.length > 0) {
            console.log('First result:', results[0].name);
        }
    } catch (error) {
        console.error('CRITICAL ERROR in searchResorts:', error);
    }
}

testSearch();
