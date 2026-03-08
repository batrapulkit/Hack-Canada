
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import AmadeusEnterpriseService from './src/services/amadeusEnterpriseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function showProof() {
    console.log("🔍 SEARCHING FOR LIVE FLIGHTS (LHR -> JFK)...");

    // 1. Get Keys
    const { data: config } = await supabase
        .from('agency_gds_config')
        .select('*')
        .neq('amadeus_client_id', null)
        .limit(1)
        .single();

    if (!config) {
        console.log("❌ No Keys found in DB.");
        return;
    }

    const service = new AmadeusEnterpriseService({
        amadeus_client_id: config.amadeus_client_id,
        amadeus_client_secret: config.amadeus_client_secret,
        amadeus_url: 'https://test.api.amadeus.com'
    });

    await service.authenticate();

    // 2. Search
    const flights = await service.searchFlights({
        originLocationCode: 'LHR',
        destinationLocationCode: 'JFK',
        departureDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        adults: 1
    });

    // 3. SHOW THE DATA
    if (flights.length > 0) {
        console.log(`\n✅ SUCCESS! Found ${flights.length} flights.`);
        console.log("------------------------------------------------");
        // Show first 3
        flights.slice(0, 3).forEach((f, i) => {
            const airline = f.validatingAirlineCodes[0];
            const price = f.price.total;
            const currency = f.price.currency;
            const segments = f.itineraries[0].segments;
            const flightNum = `${segments[0].carrierCode}${segments[0].number}`;
            const time = segments[0].departure.at;

            console.log(`${i + 1}. [${airline}] Flight ${flightNum} @ ${time}`);
            console.log(`   Price: ${price} ${currency}`);
            console.log("------------------------------------------------");
        });
    } else {
        console.log("⚠️  Auth worked, but 0 flights found. (Try changing dates?)");
    }
}

showProof();
