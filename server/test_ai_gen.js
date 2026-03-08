import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAI() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'demo@triponic.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Got token');

        console.log('Generating AI itinerary (no client)...');
        const res = await axios.post('http://localhost:5000/api/itineraries/generate', {
            destination: 'London',
            duration: 3,
            budget: '2000',
            currency: 'USD',
            travelers: 1,
            client_id: null // Explicitly null
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Success:', res.data.success);
        if (res.data.itinerary.client_id === null) {
            console.log('Verified: client_id is null');
        } else {
            console.log('Warning: client_id is', res.data.itinerary.client_id);
        }

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testAI();
