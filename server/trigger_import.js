
import axios from 'axios';
import fs from 'fs';

const AGENCY_ID = fs.readFileSync('agency_id.txt', 'utf8').trim();
const PNR_ID = 'eJzTd9e39Hd2NPMGAAqYAjM';

console.log(`Triggering Import for Agency: ${AGENCY_ID}, PNR: ${PNR_ID}`);

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const authRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'demo@triponic.com',
            password: 'password123'
        });
        const token = authRes.data.token;
        console.log('Logged in. Token obtained.');

        // 2. Import
        console.log('Sending Import Request...');
        const res = await axios.post('http://localhost:5000/api/integrations/gds/import', {
            agency_id: AGENCY_ID,
            pnr: PNR_ID
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Import Success:', JSON.stringify(res.data, null, 2));

    } catch (err) {
        console.error('Import Failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    }
}

run();
