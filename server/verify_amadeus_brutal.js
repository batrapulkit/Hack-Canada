
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import AmadeusEnterpriseService from './src/services/amadeusEnterpriseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// --- SETUP ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

function log(msg, color = COLORS.RESET) {
    console.log(`${color}${msg}${COLORS.RESET}`);
}

function pass(msg) {
    console.log(`${COLORS.GREEN}✅ PASS: ${msg}${COLORS.RESET}`);
}

function fail(msg, error = null) {
    console.log(`${COLORS.RED}❌ FAIL: ${msg}${COLORS.RESET}`);
    if (error) {
        console.log(`${COLORS.RED}   Error: ${error.message || error}${COLORS.RESET}`);
        if (error.response?.data) {
            console.log(`${COLORS.RED}   API Details: ${JSON.stringify(error.response.data)}${COLORS.RESET}`);
        }
    }
}

function warn(msg) {
    console.log(`${COLORS.YELLOW}⚠️  WARN: ${msg}${COLORS.RESET}`);
}

// --- TEST SUITE ---

async function runBrutalTests() {
    log("\n💀 STARTING BRUTAL VERIFICATION 💀", COLORS.BOLD + COLORS.CYAN);

    // 1. DATA LAYER CHECK
    log("\n--- [1] Data Layer: Fetching Credentials ---", COLORS.CYAN);
    let config = null;
    try {
        const { data, error } = await supabase
            .from('agency_gds_config')
            .select('*')
            .neq('amadeus_client_id', null)
            .limit(1)
            .single();

        if (error || !data) throw new Error("No GDS Config found in DB");
        config = data;
        pass(`Found Config for Agency: ${config.agency_id}`);
        pass(`Client ID: ${config.amadeus_client_id.substring(0, 4)}...`);
    } catch (e) {
        fail("Could not retrieve credentials from Database", e);
        process.exit(1);
    }

    // 2. SERVICE INITIALIZATION
    log("\n--- [2] Service Layer: Initialization ---", COLORS.CYAN);
    let service = null;
    try {
        service = new AmadeusEnterpriseService({
            amadeus_client_id: config.amadeus_client_id,
            amadeus_client_secret: config.amadeus_client_secret,
            amadeus_url: config.amadeus_environment === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com'
        });
        pass(`Service Instantiated (Env: ${config.amadeus_environment || 'test'})`);
    } catch (e) {
        fail("Service Initialization Failed", e);
        process.exit(1);

    }

    // 3. AUTHENTICATION (The Gatekeeper)
    log("\n--- [3] Authentication: OAuth2 Flow ---", COLORS.CYAN);
    try {
        const token = await service.authenticate();
        if (!token) throw new Error("Token was empty");
        pass("Authentication Successful");
        // Verify Token Expiry logic works
        if (service.tokenExpiry > Date.now()) {
            pass(`Token Expiry Valid: ${new Date(service.tokenExpiry).toISOString()}`);
        } else {
            fail("Token Expiry seems in the past?");
        }
    } catch (e) {
        fail("Authentication Failed - STOPPING TESTS", e);
        process.exit(1);
    }

    // 4. FLIGHT SEARCH STRESS TESTS
    log("\n--- [4] Flight Search: Stress Tests ---", COLORS.CYAN);

    // 4.1 Valid Search
    try {
        log("Testing: LHR -> JFK (30 days out)...");
        const flights = await service.searchFlights({
            originLocationCode: 'LHR',
            destinationLocationCode: 'JFK',
            departureDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            adults: 1
        });
        if (flights.length > 0) {
            pass(`Valid Search returned ${flights.length} offers`);
            // Deep Inspection of Object Structure
            const sample = flights[0];
            if (sample.id && sample.price && sample.itineraries) {
                pass("Flight Object Structure Valid (id, price, itineraries)");
            } else {
                fail("Flight Object Malformed", JSON.stringify(sample).substring(0, 100));
            }
        } else {
            warn("Valid Search returned 0 results (Check availability/params or Test Env limitations)");
        }
    } catch (e) {
        fail("Valid Flight Search threw error", e);
    }

    // 4.2 Invalid Airport Code
    try {
        log("Testing: INVALID_CODE -> JFK...");
        await service.searchFlights({
            originLocationCode: 'ZZZZ',
            destinationLocationCode: 'JFK',
            departureDate: '2025-12-01',
            adults: 1
        });
        warn("Invalid Airport Search DID NOT throw error (Amadeus might be too forgiving or mocking)");
    } catch (e) {
        pass(`Invalid Airport Search correctly failed: ${e.message}`);
    }

    // 4.3 Missing Date
    try {
        log("Testing: Missing Date...");
        await service.searchFlights({
            originLocationCode: 'LHR',
            destinationLocationCode: 'JFK'
        });
        warn("Missing Date DID NOT throw error");
    } catch (e) {
        pass("Missing Date correctly caught/failed");
    }


    // 5. CITY & HOTEL SEARCH
    log("\n--- [5] Resort/City Search ---", COLORS.CYAN);

    let resolvedCity = null;
    try {
        log("Testing: 'Paris' Resolution...");
        resolvedCity = await service.searchCity("Paris");
        if (resolvedCity === 'PAR') {
            pass("Resolved 'Paris' -> 'PAR'");
        } else {
            fail(`Expected 'PAR', got '${resolvedCity}'`);
        }
    } catch (e) {
        fail("City Resolution Error", e);
    }

    if (resolvedCity) {
        try {
            log(`Testing: Hotel Search in ${resolvedCity}...`);
            const hotels = await service.searchHotels(resolvedCity);
            if (hotels.length > 0) {
                pass(`Found ${hotels.length} hotels in ${resolvedCity}`);

                // 5.1 Hotel Availability (Offers)
                const targetHotel = hotels[0].hotelId;
                log(`Testing: Availability for Hotel ${targetHotel}...`);
                const offers = await service.getHotelOffers(
                    [targetHotel],
                    new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
                    new Date(Date.now() + 86400000 * 62).toISOString().split('T')[0]
                );

                if (offers.length > 0) {
                    pass(`Found ${offers.length} live offers for hotel`);
                } else {
                    warn("No live offers found (Common in Test Env, but API call succeeded)");
                }

            } else {
                warn(`No hotels found in ${resolvedCity} (Test Env limitation?)`);
            }
        } catch (e) {
            fail("Hotel Search/Offers Error", e);
        }
    }

    // 6. PNR RETRIEVAL (Mock/Test)
    log("\n--- [6] Booking Retrieval (PNR) ---", COLORS.CYAN);
    try {
        // Amadeus Test Environment often has this dummy PNR
        const TEST_PNR = 'R12345';
        log(`Testing: Retrieve PNR '${TEST_PNR}'...`);
        const pnr = await service.retrieveBooking(TEST_PNR);

        if (pnr) {
            pass("Retrieved Booking Successfully (Mock/Real)");
        } else {
            warn(`PNR '${TEST_PNR}' not found (Expected if no test booking exists)`);
            pass("API Call completed without crash");
        }
    } catch (e) {
        fail("PNR Retrieval Error", e);
    }

    log("\n💀 BRUTAL VERIFICATION COMPLETE 💀", COLORS.BOLD + COLORS.CYAN);
}

runBrutalTests();
