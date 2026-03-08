import dotenv from 'dotenv';
import AmadeusEnterpriseService from './src/services/amadeusEnterpriseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Test Amadeus Authentication
 * Checks keys and attempts OAuth2 flow
 */
async function testAuth() {
    console.log("=== Testing Amadeus REST/OAuth2 Authentication ===");

    // Check for API Keys
    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_SECRET || process.env.AMADEUS_SECRET_KEY;

    console.log("API Key found:", !!apiKey); // Do not log full key
    console.log("API Secret found:", !!apiSecret);

    if (!apiKey || !apiSecret) {
        console.error("❌ Missing AMADEUS_API_KEY or AMADEUS_SECRET_KEY in .env");
        process.exit(1);
    }

    const service = new AmadeusEnterpriseService({
        amadeus_api_key: apiKey,
        amadeus_secret_key: apiSecret, // Pass explicitly as secret_key to match service mapping
        amadeus_url: process.env.AMADEUS_URL // Optional, defaults to test
    });

    try {
        console.log("Initiating Authentication...");
        const token = await service.authenticate();
        console.log("✅ Authentication Successful!");
        console.log("Access Token received: " + token.substring(0, 10) + "...");

    } catch (error) {
        console.error("❌ Authentication Failed");
        console.error(error.message);
    }
}

testAuth();
