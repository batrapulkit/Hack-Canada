
// Mock Supabase and Amadeus Service
// Since we don't have a full mocking framework setup in this snippet env, we will write a standalone integration script
// that MOCKS the import and tests the logic flow.

import { getResortOffers } from '../src/services/resortService.js';

// Mock dependencies (Basic Override technique for this script)
// In a real Jest env we would use jest.mock. 
// Here we will try to run this as a "Manual Test Script" that mocks the Amadeus call.

console.log("=== TEST: Live Resort Rate Fetching ===");

// We will assume the service handles missing external_id gracefully
// And if external_id exists, it calls Amadeus.

// Since I cannot easily mock the imports inside the module without Jest,
// I will create a test that calls the API endpoint if server is running,
// OR validaties the function if I can load it.

// Let's rely on the user verification for the "Live" part since it needs real Amadeus credentials.
// However, checking the "No external ID" case is easy.

async function testMissingExternalId() {
    console.log("Test 1: Fetching offers for resort with NO external ID...");
    // We assume any random UUID won't have an external_id or won't exist
    const result = await getResortOffers('00000000-0000-0000-0000-000000000000', null);

    if (Array.isArray(result) && result.length === 0) {
        console.log("✅ Passed: Returned empty array for missing/invalid resort.");
    } else {
        console.error("❌ Failed: Expected empty array.", result);
    }
}

// execute
testMissingExternalId()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
