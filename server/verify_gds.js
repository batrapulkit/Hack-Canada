import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import AmadeusEnterpriseService from './src/services/amadeusEnterpriseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function verify() {
    console.log("=== Verifying GDS Integration Setup ===");

    // 1. Check Database Table
    console.log("1. Checking 'agency_gds_config' table...");
    const { data, error } = await supabase.from('agency_gds_config').select('count', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') {
            console.error("❌ Table 'agency_gds_config' does not exist. Please run the migration 'migrations/20260106_add_gds_config.sql'.");
        } else {
            console.error("❌ Database Error:", error.message);
        }
    } else {
        console.log("✅ Table 'agency_gds_config' exists and is accessible.");
    }

    // 2. Check Service Instantiation
    console.log("2. Testing Service Instantiation...");
    try {
        const service = new AmadeusEnterpriseService({
            amadeus_oid: 'TEST',
            amadeus_originator: 'TEST',
            amadeus_password_hash: 'TEST'
        });
        console.log("✅ AmadeusEnterpriseService instantiated successfully.");
    } catch (err) {
        console.error("❌ Service Instantiation Failed:", err);
    }

    console.log("=== Verification Complete ===");
}

verify();
