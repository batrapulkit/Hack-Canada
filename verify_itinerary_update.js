import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/ai/chat';

// NOTE: This script assumes you have a valid mechanism to authenticate or that the endpoint
// is accessible. In the current codebase, it requires `req.user` which comes from auth middleware.
// So this script is a TEMPLATE. You would need to inject a valid JWT in the headers.

async function verify() {
    console.log("Starting verification...");

    // 1. Health Check
    try {
        const health = await fetch('http://localhost:5000/api/health');
        console.log("Health Check:", await health.json());
    } catch (e) {
        console.error("Server not reachable:", e.message);
        return;
    }

    // 2. Mock Chat Request (will likely fail 401 without token)
    // const res = await fetch(API_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: 'Create a 3 day trip to Paris' })
    // });
    // console.log("Chat Response:", await res.json());
}

verify();
