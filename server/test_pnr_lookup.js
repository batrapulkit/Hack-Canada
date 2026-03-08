
import axios from 'axios';
import qs from 'querystring';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.AMADEUS_API_KEY;
const CLIENT_SECRET = process.env.AMADEUS_SECRET_KEY;
const BASE_URL = process.env.AMADEUS_URL || 'https://test.api.amadeus.com';
const PNR = '9OB5L5'; // The PNR user has

async function testLookup() {
    console.log(`Testing Lookup for PNR: ${PNR}`);

    // 1. Auth
    const authUrl = `${BASE_URL}/v1/security/oauth2/token`;
    const authData = qs.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    });

    let token;
    try {
        const authRes = await axios.post(authUrl, authData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        token = authRes.data.access_token;
        console.log('Auth Success.');
    } catch (e) {
        console.error('Auth Failed');
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // Test 1: By ID (Simulated - assuming we don't have it, but we know it failed)
    // Test 2: List with reference
    // documentation often suggests filtering not available in free tier, but let's try.

    // Attempt 1: List All (Is it possible?)
    try {
        console.log('Attempt 1: LIST GET /v1/booking/flight-orders');
        const res = await axios.get(`${BASE_URL}/v1/booking/flight-orders`, { headers });
        console.log('  Result Count:', res.data.data ? res.data.data.length : 'No Data field');
        if (res.data.data) {
            const found = res.data.data.find(o => o.associatedRecords.some(r => r.reference === PNR));
            console.log('  Found PNR in list?', found ? 'YES' : 'NO');
            if (found) console.log('  ID:', found.id);
        }
    } catch (e) {
        console.log('  Failed:', e.response?.status, JSON.stringify(e.response?.data));
    }

    // Attempt 2: ?associatedRecords[0].reference=
    // (Amadeus complex filter syntax sometimes works)
    try {
        console.log('Attempt 2: GET /v1/booking/flight-orders?id=' + PNR);
        const res = await axios.get(`${BASE_URL}/v1/booking/flight-orders?id=${PNR}`, { headers });
        console.log('  Result:', res.data);
    } catch (e) {
        console.log('  Failed:', e.response?.status, JSON.stringify(e.response?.data));
    }

    // Attempt 3: Retrieve by PNR directly (Enterprise endpoint style - unlikely to work on test but worth a shot)
    try {
        console.log('Attempt 3: GET /v1/pnr/retrieval/' + PNR);
        const res = await axios.get(`${BASE_URL}/v1/pnr/retrieval/${PNR}`, { headers });
        console.log('  Result:', res.data);
    } catch (e) {
        console.log('  Failed:', e.response?.status, JSON.stringify(e.response?.data));
    }

}

testLookup();
