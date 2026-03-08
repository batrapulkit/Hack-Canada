import axios from 'axios';

const PROD_URL = 'https://api.amadeus.com/v1/security/oauth2/token';

console.log(`Testing Connectivity to Production: ${PROD_URL}`);

async function testProd() {
    try {
        // sending a dummy request just to check connectivity
        // Expected: 401 (if connected but bad keys) or 400.
        // If ENOTFOUND, then it's network/DNS.
        const response = await axios.post(PROD_URL, 'grant_type=client_credentials&client_id=TEST&client_secret=TEST', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Success (Unexpected for dummy keys):', response.status);
    } catch (error) {
        if (error.response) {
            console.log(`Connected! Server responded with Status: ${error.response.status}`);
            console.log('This confirms the Production URL is REACHABLE.');
            console.log('If you are getting specific errors, it is likely regarding your Keys.');
        } else {
            console.error('Connection FAILED:', error.message);
            console.error('Code:', error.code);
            if (error.code === 'ENOTFOUND') {
                console.error('>> DNS Error: Your computer cannot find api.amadeus.com');
            }
        }
    }
}

testProd();
