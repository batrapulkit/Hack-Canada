import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import AmadeusEnterpriseService from '../services/amadeusEnterpriseService.js';
import { importBookingData } from '../services/bookingImportService.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Use Service Role Key for full access

/**
 * PNR Synchronization Worker
 * Scans configured queues for all agencies and discovers new PNRs
 */
const runPnrSync = async () => {
    console.log('[Cron] Starting PNR Sync...');

    try {
        // 1. Fetch agencies with active GDS configuration
        const { data: configs, error } = await supabase
            .from('agency_gds_config')
            .select('*')
            .eq('sync_status', 'active')
            .neq('amadeus_client_id', null)
            .neq('amadeus_client_secret', null)
            .neq('amadeus_client_id', '')
            .neq('amadeus_client_secret', '');

        if (error) throw error;
        if (!configs || configs.length === 0) {
            console.log('[Cron] No active GDS configurations found.');
            return;
        }

        console.log(`[Cron] Found ${configs.length} agencies to sync.`);

        // 2. Process each agency
        for (const config of configs) {
            // Extra check for empty strings/undefined
            if (!config.amadeus_client_id || !config.amadeus_client_secret) continue;
            await syncAgency(config);
        }

    } catch (err) {
        console.error('[Cron] PNR Sync Fatal Error:', err);
    }
};

const syncAgency = async (config) => {
    const amadeus = new AmadeusEnterpriseService(config);
    const logPrefix = `[Agency ${config.agency_id}]`;

    try {
        console.log(`${logPrefix} Starting Queue Scan...`);

        // Connect & Scan
        await amadeus.authenticate();
        const pnrs = await amadeus.scanQueue(config.amadeus_queue_number || '50');

        console.log(`${logPrefix} Found ${pnrs.length} PNRs in queue.`);

        // Process distinct PNRs
        for (const pnrStub of pnrs) {

            // Retrieve Full Details
            // Use correct method name: retrieveBooking
            let pnrData = null;
            try {
                pnrData = await amadeus.retrieveBooking(pnrStub.recordLocator || pnrStub.id);
            } catch (e) {
                console.error(`${logPrefix} Failed to retrieve PNR ${pnrStub.recordLocator}:`, e.message);
                continue;
            }

            if (pnrData) {
                // Save to Triponic DB (Single Source of Truth)
                try {
                    const { action } = await importBookingData(config.agency_id, pnrData, pnrData.id); // Use ID as PNR ref if needed
                    console.log(`${logPrefix} Auto-Imported PNR ${pnrData.id} (${action}).`);
                } catch (saveErr) {
                    console.error(`${logPrefix} Failed to save PNR ${pnrData.id}:`, saveErr.message);
                }
            }

            // Remove from Queue (so we don't process it forever)
            if (pnrData) {
                await amadeus.removeFromQueue(pnrStub.recordLocator, config.amadeus_queue_number);
            }
        }

        // Update Sync Status
        await supabase
            .from('agency_gds_config')
            .update({
                last_queue_scan_time: new Date().toISOString(),
                sync_error_log: null
            })
            .eq('id', config.id);

        await amadeus.signOut();

    } catch (err) {
        console.error(`${logPrefix} Sync Failed:`, err.message);

        // Log error to DB
        await supabase
            .from('agency_gds_config')
            .update({
                sync_error_log: err.message,
                // sync_status: 'error' // Optional: don't disable automatically, just log
            })
            .eq('id', config.id);
    }
};

// Schedule: Run every 15 minutes
// For Dev: Running every 1 minute if ENABLE_CRON is true
export const startPnrSync = () => {
    // Every 15 minutes: '*/15 * * * *'
    cron.schedule('*/15 * * * *', runPnrSync);
    console.log('[Cron] PNR Sync scheduled (every 15 min).');
};

// Allow manual trigger for testing
export const forceSync = runPnrSync;
