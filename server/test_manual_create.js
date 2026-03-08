import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testCreate() {
    try {
        // Assuming we need auth, but for local dev maybe we can bypass or login first?
        // authenticate middleware checks for token.
        // We need to login to get a token.

        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'demo@triponic.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 2. Create Itinerary
        console.log('Creating itinerary...');
        const res = await axios.post('http://localhost:5000/api/itineraries', {
            destination: 'Test City',
            duration: 3,
            budget: '1000',
            currency: 'USD',
            travelers: 2,
            client_id: null, // Need to see if it allows null or if foreign key fails?
            // Wait, schema says client_id REFERENCES clients(id) ON DELETE SET NULL
            // So it should allow null.
            start_date: '2026-05-01',
            end_date: '2026-05-04',
            title: 'Test Trip'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testCreate();
