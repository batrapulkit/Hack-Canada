import axios from 'axios';
import https from 'https';
import dns from 'dns';

// Keys captured from previous error logs
const CLIENT_ID = 'aLrN8J9f5WrL0DZNUwO55kbovrkDAAAU';
const CLIENT_SECRET = 'S447CN1OAWfxrCMJ';

const PROD_URL = 'https://api.amadeus.com/v1/security/oauth2/token';
const TEST_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';

async function testAuth(url, name) {
    console.log(`\nTesting ${name} Environment...`);
    try {
        const response = await axios.post(url,
            `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                family: 4 // Force IPv4 to avoid DNS issues during test
            }
        );
        console.log(`✅ SUCCESS on ${name}! Access Token received.`);
        return true;
    } catch (error) {
        if (error.response) {
            console.log(`❌ FAILED on ${name}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`❌ ERROR on ${name}: ${error.message}`);
        }
        return false;
    }
}

async function run() {
    // 1. Try Test (Expected to fail based on logs, but good to double check)
    await testAuth(TEST_URL, 'TEST');

    // 2. Try Prod (The hypothesis)
    await testAuth(PROD_URL, 'PRODUCTION');
}

run();
