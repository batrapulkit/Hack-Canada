import express from 'express';
import { createClient } from '@supabase/supabase-js';
import AmadeusEnterpriseService from '../services/amadeusEnterpriseService.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
// Use Service Role Key to bypass RLS for backend operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware to get agency config
const getAgencyConfig = async (agencyId) => {
    const { data, error } = await supabase
        .from('agency_gds_config')
        .select('*')
        .eq('agency_id', agencyId)
        .single();

    if (error) return null;
    return data;
};

// GET /api/integrations/gds?agency_id=...
router.get('/gds', async (req, res) => {
    const { agency_id } = req.query;
    if (!agency_id) return res.status(400).json({ error: 'Agency ID required' });

    const config = await getAgencyConfig(agency_id);
    res.json(config || {});
});

// POST /api/integrations/gds
// POST /api/integrations/gds
router.post('/gds', async (req, res) => {
    const { agency_id, amadeus_client_id, amadeus_client_secret, amadeus_oid, amadeus_originator, amadeus_environment } = req.body;

    // Upsert config
    const { data, error } = await supabase
        .from('agency_gds_config')
        .upsert({
            agency_id,
            amadeus_client_id: amadeus_client_id?.trim(),
            amadeus_client_secret: amadeus_client_secret?.trim(),
            amadeus_environment: amadeus_environment || 'test',
            amadeus_queue_number: req.body.amadeus_queue_number || '50',
            updated_at: new Date()
        }, { onConflict: 'agency_id' })
        .select()
        .single();

    if (error) {
        console.error('Save Config Error:', error);
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, config: data });
});

// POST /api/integrations/gds/test
router.post('/gds/test', async (req, res) => {
    const { agency_id } = req.body;
    if (!agency_id) return res.status(400).json({ error: 'Agency ID required' });

    try {
        const config = await getAgencyConfig(agency_id);
        if (!config || !config.amadeus_client_id || !config.amadeus_client_secret) {
            return res.status(400).json({ error: 'Configuration missing. Please add API Key and Secret.' });
        }

        const amadeus = new AmadeusEnterpriseService({
            amadeus_client_id: config.amadeus_client_id,
            amadeus_client_secret: config.amadeus_client_secret,
            amadeus_environment: config.amadeus_environment,
            amadeus_url: config.amadeus_environment === 'production'
                ? 'https://api.amadeus.com'
                : 'https://test.api.amadeus.com'
        });

        // 1. Verify Credentials
        await amadeus.authenticate();
        console.log(`[GDS Test] Authentication successful for ${config.amadeus_environment} environment`);

        // 2. Actually scan for available bookings
        const foundBookings = await amadeus.findRecentBookings();
        console.log(`[GDS Test] Found ${foundBookings.length} bookings`);

        res.json({
            success: true,
            message: foundBookings.length > 0
                ? `Connection successful! Found ${foundBookings.length} booking(s) ready to import.`
                : 'Connection successful! No pending bookings found.',
            found_bookings_count: foundBookings.length,
            env: config.amadeus_environment
        });

    } catch (error) {
        console.error("[GDS Test] Error:", error.message);

        // Provide specific error messages
        if (error.code === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                success: false,
                error: 'Invalid API credentials. Please check your Amadeus API Key and Secret.'
            });
        } else if (error.code === 'NETWORK_ERROR') {
            return res.status(503).json({
                success: false,
                error: 'Network error connecting to Amadeus. Please check your internet connection.'
            });
        }

        res.status(400).json({
            success: false,
            error: error.message || 'Authentication failed. Check your keys.'
        });
    }
});

// Helper to Process & Save Booking Data
import { importBookingData } from '../services/bookingImportService.js';

// POST /api/integrations/gds/import-batch
router.post('/gds/import-batch', async (req, res) => {
    try {
        const { agency_id } = req.body;

        if (!agency_id) {
            return res.status(400).json({
                success: false,
                error: 'Agency ID required'
            });
        }

        // 1. Get Config with validation
        const config = await getAgencyConfig(agency_id);
        if (!config || !config.amadeus_client_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing GDS Configuration. Please add your Amadeus credentials in Settings.'
            });
        }

        // 2. Init Service
        const amadeus = new AmadeusEnterpriseService({
            amadeus_client_id: config.amadeus_client_id,
            amadeus_client_secret: config.amadeus_client_secret,
            amadeus_environment: config.amadeus_environment,
            amadeus_url: config.amadeus_environment === 'production'
                ? 'https://api.amadeus.com'
                : 'https://test.api.amadeus.com'
        });

        // 3. Authenticate with specific error handling
        try {
            await amadeus.authenticate();
        } catch (authError) {
            console.error('[Batch Import] Auth failed:', authError);
            return res.status(401).json({
                success: false,
                error: authError.message || 'Authentication failed. Please check your credentials.'
            });
        }

        // 4. Find Real Bookings
        const foundBookings = await amadeus.findRecentBookings();
        const results = [];
        const errors = [];

        // 5. Process each booking with individual error handling
        for (let i = 0; i < foundBookings.length; i++) {
            const booking = foundBookings[i];
            try {
                const pnr = booking.id || booking.associatedRecords?.[0]?.reference;
                if (!pnr) {
                    errors.push({ index: i + 1, error: 'No PNR found' });
                    continue;
                }

                const result = await importBookingData(agency_id, booking, pnr);
                results.push({
                    pnr,
                    action: result.action,
                    client: result.client?.full_name
                });
            } catch (err) {
                console.error(`[Batch Import] Failed booking ${i + 1}:`, err.message);
                errors.push({
                    index: i + 1,
                    pnr: booking.id || 'unknown',
                    error: err.message
                });
            }
        }

        // 6. Always return success to prevent frontend crashes
        res.json({
            success: true,
            message: foundBookings.length > 0
                ? `Batch import completed. ${results.length} of ${foundBookings.length} items imported successfully.`
                : 'No recent bookings found in Amadeus account.',
            total_found: foundBookings.length,
            imported_count: results.length,
            error_count: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("[Batch Import] Unexpected error:", error);
        // Return structured error for frontend
        res.status(500).json({
            success: false,
            error: 'Import failed. Please try again or contact support.',
            details: error.message
        });
    }
});

// POST /api/integrations/gds/import
router.post('/gds/import', async (req, res) => {
    const { agency_id, pnr } = req.body;


    if (!agency_id || !pnr) return res.status(400).json({ error: 'Agency ID and PNR required' });

    try {
        // 1. Get Config
        const config = await getAgencyConfig(agency_id);
        if (!config || !config.amadeus_client_id || !config.amadeus_client_secret) {
            return res.status(400).json({ error: 'GDS Integration not configured or missing API credentials.' });
        }

        // 2. Init Service
        const amadeus = new AmadeusEnterpriseService({
            amadeus_client_id: config.amadeus_client_id,
            amadeus_client_secret: config.amadeus_client_secret,
            amadeus_url: config.amadeus_environment === 'production'
                ? 'https://api.amadeus.com'
                : 'https://test.api.amadeus.com'
        });

        // 3. Authenticate & Fetch
        await amadeus.authenticate();

        const bookingData = await amadeus.retrieveBooking(pnr);

        if (!bookingData) {
            return res.status(404).json({ error: `Booking not found for PNR: ${pnr}` });
        }



        // 4. Save Data via Helper
        const { client, booking, action } = await importBookingData(agency_id, bookingData, pnr);

        res.json({
            success: true,
            message: `PNR ${pnr} ${action} successfully`,
            client,
            booking
        });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
