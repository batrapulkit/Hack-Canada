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
        console.log('      Auth Success.');
    } catch (e) {
        console.error('      Auth Failed:', e.response?.data || e.message);
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // 2. Search
    console.log('[2/4] Searching for Flight (NCE-CDG, 2 months out)...');
    // Calculate date ~60 days from now
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 60);
    const dateStr = travelDate.toISOString().split('T')[0];

    let offer;
    try {
        const searchUrl = `${BASE_URL}/v2/shopping/flight-offers?originLocationCode=NCE&destinationLocationCode=CDG&departureDate=${dateStr}&adults=1&nonStop=false&max=1`;
        const searchRes = await axios.get(searchUrl, { headers });
        if (!searchRes.data.data || searchRes.data.data.length === 0) {
            console.error('      No flights found.');
            return;
        }
        offer = searchRes.data.data[0];
        console.log('      Flight Found:', offer.itineraries[0].segments[0].carrierCode + offer.itineraries[0].segments[0].number);
    } catch (e) {
        console.error('      Search Failed:', e.response?.data || e.message);
        return;
    }

    // 3. Confirm Price (Pricing)
    console.log('[3/4] Confirming Price...');
    let pricedOffer;
    try {
        const priceUrl = `${BASE_URL}/v1/shopping/flight-offers/pricing`;
        const priceRes = await axios.post(priceUrl, {
            data: {
                type: 'flight-offers-pricing',
                flightOffers: [offer]
            }
        }, { headers });
        pricedOffer = priceRes.data.data.flightOffers[0];
        console.log('      Price Confirmed:', pricedOffer.price.grandTotal, pricedOffer.price.currency);
    } catch (e) {
        console.error('      Pricing Failed:', e.response?.data || e.message);
        return;
    }

    // 4. Create Order
    console.log('[4/4] Creating Order (Booking)...');
    try {
        const orderUrl = `${BASE_URL}/v1/booking/flight-orders`;
        const orderBody = {
            data: {
                type: 'flight-order',
                flightOffers: [pricedOffer],
                travelers: [
                    {
                        id: '1',
                        dateOfBirth: '1982-01-16',
                        name: {
                            firstName: 'JUPITER',
                            lastName: 'TESTER'
                        },
                        gender: 'MALE',
                        contact: {
                            emailAddress: 'jupiter.test@email.com',
                            phones: [{
                                deviceType: 'MOBILE',
                                countryCallingCode: '33',
                                number: '480080080'
                            }]
                        }
                    }
                ]
            }
        };

        const orderRes = await axios.post(orderUrl, orderBody, { headers });
        const booking = orderRes.data.data;
        const pnr = booking.associatedRecords.find(r => r.originSystemCode === 'GDS').reference;

        fs.writeFileSync('pnr.txt', pnr);
        fs.writeFileSync('id.txt', booking.id);

        console.log('\n=============================================');
        console.log(' PNR CREATED SUCCESSFULLY!');
        console.log(` PNR: ${pnr}`);
        console.log(` Amadeus ID: ${booking.id}`);
        console.log('=============================================\n');

    } catch (e) {
        console.error('      Booking Failed:', e.response?.data?.errors || e.response?.data || e.message);
    }
}

createTestPNR();
