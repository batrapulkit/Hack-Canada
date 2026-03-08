
import axios from 'axios';
import qs from 'querystring';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const CLIENT_ID = process.env.AMADEUS_API_KEY;
const CLIENT_SECRET = process.env.AMADEUS_SECRET_KEY;
const BASE_URL = process.env.AMADEUS_URL || 'https://test.api.amadeus.com';

async function createTestPNR() {
    console.log('[1/4] Authenticating...');

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
    } catch (e) {
        console.error('Auth Failed:', e.message);
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // 2. Search (Different route: MAD-BCN to make it distinct)
    console.log('[2/4] Searching for Flight (MAD-BCN)...');
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 45); // 45 days out
    const dateStr = travelDate.toISOString().split('T')[0];

    let offer;
    try {
        const searchUrl = `${BASE_URL}/v2/shopping/flight-offers?originLocationCode=MAD&destinationLocationCode=BCN&departureDate=${dateStr}&adults=1&nonStop=false&max=1`;
        const searchRes = await axios.get(searchUrl, { headers });
        offer = searchRes.data.data[0];
    } catch (e) {
        console.error('Search Failed:', e.message);
        return;
    }

    // 3. Confirm Price
    console.log('[3/4] Pricing...');
    let pricedOffer;
    try {
        const priceUrl = `${BASE_URL}/v1/shopping/flight-offers/pricing`;
        const priceRes = await axios.post(priceUrl, {
            data: { type: 'flight-offers-pricing', flightOffers: [offer] }
        }, { headers });
        pricedOffer = priceRes.data.data.flightOffers[0];
    } catch (e) {
        console.error('Pricing Failed:', e.message);
        return;
    }

    // 4. Create Order
    console.log('[4/4] Booking...');
    try {
        const orderUrl = `${BASE_URL}/v1/booking/flight-orders`;
        const orderBody = {
            data: {
                type: 'flight-order',
                flightOffers: [pricedOffer],
                travelers: [{
                    id: '1',
                    dateOfBirth: '1990-05-20',
                    name: { firstName: 'MARS', lastName: 'TRAVELER' },
                    gender: 'FEMALE',
                    contact: {
                        emailAddress: 'mars.traveler@email.com',
                        phones: [{ deviceType: 'MOBILE', countryCallingCode: '34', number: '600000000' }]
                    }
                }]
            }
        };

        const orderRes = await axios.post(orderUrl, orderBody, { headers });
        const booking = orderRes.data.data;

        fs.writeFileSync('id_2.txt', booking.id);
        console.log('Created 2nd Booking ID:', booking.id);

    } catch (e) {
        console.error('Booking Failed:', e.response?.data?.errors || e.message);
    }
}

createTestPNR();
