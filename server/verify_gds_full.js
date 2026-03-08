
import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';
const AGENCY_ID_FILE = 'agency_id.txt'; // We might need to fetch this again if deleted
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 0. Setup: Get Agency ID & Token
async function setup() {
    console.log('--- [0] SETUP ---');
    try {
        // Authenticate as Demo User
        const authRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'demo@triponic.com',
            password: 'password123'
        });
        const token = authRes.data.token;
        const agencyId = authRes.data.user.agency_id;
        console.log('✅ Logged in as demo@triponic.com');
        console.log(`✅ Agency ID: ${agencyId}`);
        return { token, agencyId };
    } catch (e) {
        console.error('❌ Setup Failed:', e.message);
        process.exit(1);
    }
}

// 1. Test Saving Configuration
async function testSaveConfig(token, agencyId) {
    console.log('\n--- [1] TEST: SAVE CONFIGURATION ---');
    try {
        const payload = {
            agency_id: agencyId,
            amadeus_client_id: process.env.AMADEUS_API_KEY,
            amadeus_client_secret: process.env.AMADEUS_SECRET_KEY,
            amadeus_environment: 'test',
            amadeus_queue_number: '50' // Testing new field
        };

        const res = await axios.post(`${BASE_URL}/integrations/gds`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success && res.data.config.amadeus_queue_number === '50') {
            console.log('✅ Configuration Saved Successfully (including Queue 50)');
        } else {
            console.log('⚠️ Config saved but Queue check failed:', res.data);
        }
    } catch (e) {
        console.error('❌ Save Config Failed:', e.response?.data || e.message);
    }
}

// 2. Test Connection Check
async function testConnection(token, agencyId) {
    console.log('\n--- [2] TEST: CONNECTION CHECK ---');
    try {
        const res = await axios.post(`${BASE_URL}/integrations/gds/test`, { agency_id: agencyId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            console.log(`✅ Connection Verified. Env: ${res.data.env}`);
            console.log(`ℹ️  Found Mock/Test Bookings: ${res.data.found_bookings_count}`);
        } else {
            console.error('❌ Connection Test Failed:', res.data);
        }
    } catch (e) {
        console.error('❌ Connection Test Error:', e.response?.data || e.message);
    }
}

// 3. Test Batch Import
async function testBatchImport(token, agencyId) {
    console.log('\n--- [3] TEST: BATCH IMPORT (IMPORT EVERYTHING) ---');
    try {
        const res = await axios.post(`${BASE_URL}/integrations/gds/import-batch`, { agency_id: agencyId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            console.log(`✅ Batch Import Success: ${res.data.message}`);
            // We expect 2 items from our previous setup
            if (res.data.imported_count >= 2) {
                console.log('✅ Confirmed 2+ items imported (Multi-PNR working)');
            } else {
                console.log(`⚠️ Warning: Expected 2 items, got ${res.data.imported_count}`);
            }
        } else {
            console.error('❌ Batch Import Failed:', res.data);
        }
    } catch (e) {
        console.error('❌ Batch Import Error:', e.response?.data || e.message);
    }
}

// RUN ALL
(async () => {
    const { token, agencyId } = await setup();
    await testSaveConfig(token, agencyId);
    await testConnection(token, agencyId);
    await testBatchImport(token, agencyId);
})();
