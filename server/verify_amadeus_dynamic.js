
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import AmadeusEnterpriseService from './src/services/amadeusEnterpriseService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env for Supabase Conenction ONLY
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    RESET: '\x1b[0m',
    CYAN: '\x1b[36m'
};

function log(msg, color = COLORS.RESET) {
    console.log(`${color}${msg}${COLORS.RESET}`);
}

// Mock Database Lookup (Mirroring the logic we just added to controller)
async function getAmadeusService(agencyId, supabase) {
    log(`[System] Looking up GDS Config for Agency: ${agencyId}...`, COLORS.CYAN);

    const { data: config, error } = await supabase
        .from('agency_gds_config')
        .select('*')
        .eq('agency_id', agencyId)
        .single();

    if (error || !config) {
        log(`❌ Database Lookup Failed: ${error ? error.message : 'No config found'}`, COLORS.RED);
        return null;
    }

    log(`✅ Found Config: Client ID ending in ...${config.amadeus_client_id.slice(-4)}`, COLORS.GREEN);

    return new AmadeusEnterpriseService({
        amadeus_client_id: config.amadeus_client_id,
        amadeus_client_secret: config.amadeus_client_secret,
        amadeus_url: config.amadeus_environment === 'production'
            ? 'https://api.amadeus.com'
            : 'https://test.api.amadeus.com'
    });
}

async function verifyDynamicKeys() {
    log("\n=== 🧪 Verifying Dynamic Amadeus Keys (Database-Driven) ===", COLORS.CYAN);

    // 1. Setup Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log("❌ FAIL: Missing Supabase Credentials in .env (Needed for this test script)", COLORS.RED);
        process.exit(1);
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 2. Prompt for Keys (Since valid ones aren't in env, and I can't invent them)
    // For this automated step, I will search for an EXISTING config in the DB.
    // If none exists, I can't proceed without user input or mock data that will fail auth.

    const { data: existingConfigs } = await supabase
        .from('agency_gds_config')
        .select('agency_id')
        .neq('amadeus_client_id', null)
        .limit(1);

    let targetAgencyId = null;

    if (existingConfigs && existingConfigs.length > 0) {
        targetAgencyId = existingConfigs[0].agency_id;
        log(`ℹ️  Found existing GDS config for Agency: ${targetAgencyId}`, COLORS.YELLOW);
    } else {
        log("⚠️  No existing GDS configurations found in DB.", COLORS.YELLOW);
        log("⚠️  To fully verify, please add keys via the Settings > Integrations page first.", COLORS.YELLOW);
        log("⚠️  Test will proceed but likely fail at Authentication step if no keys exist.", COLORS.YELLOW);
        // Fallback to a dummy ID to show the LOOKUP works at least
        targetAgencyId = '00000000-0000-0000-0000-000000000000';
    }

    // 3. Test Service Instantiation via DB Lookup
    const service = await getAmadeusService(targetAgencyId, supabase);

    if (!service) {
        log("❌ FAIL: Could not create service from DB config.", COLORS.RED);
        return;
    }

    // 4. Test Authentication (Live)
    // Explicitly un-set process.env to ensure we aren't "cheating"
    const backupKey = process.env.AMADEUS_API_KEY;
    delete process.env.AMADEUS_API_KEY;
    delete process.env.AMADEUS_SECRET;

    try {
        log("\n--- Testing Authentication (Without .env) ---", COLORS.CYAN);
        await service.authenticate();
        log("✅ PASS: Authenticated successfully using Database Keys!", COLORS.GREEN);
    } catch (e) {
        log(`❌ FAIL: Authentication failed: ${e.message}`, COLORS.RED);
        log("   (This is expected if the keys in the DB are invalid or missing)", COLORS.YELLOW);
    } finally {
        // Restore for other tools
        if (backupKey) process.env.AMADEUS_API_KEY = backupKey;
    }

    log("\n=== 🏁 verification complete ===", COLORS.CYAN);
}

verifyDynamicKeys();
