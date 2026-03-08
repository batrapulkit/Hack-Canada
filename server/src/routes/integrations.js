import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
import { startPnrSync, forceSync } from '../cron/pnrSync.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Use Service Role Key for admin access

// Middleware to verify user is agency admin
// In a real app, use auth middleware from authController

// GET /api/integrations/gds
router.get('/gds', async (req, res) => {
    // Mock user ID from request (middleware should provide this)
    // const userId = req.user.id;
    // For MVP, we pass agency_id or just assume first agency for dev/demo if auth missing

    // TEMPORARY: Just get the first config found or requires agency_id in query
    // In production: Get agency_id from authenticated user session
    const { agency_id } = req.query;

    if (!agency_id) return res.status(400).json({ error: 'Agency ID required' });

    const { data, error } = await supabase
        .from('agency_gds_config')
        .select('amadeus_oid, amadeus_originator, amadeus_queue_number, last_queue_scan_time, sync_status, sync_error_log')
        .eq('agency_id', agency_id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        return res.status(500).json({ error: error.message });
    }

    res.json(data || {});
});

// POST /api/integrations/gds
router.post('/gds', async (req, res) => {
    const { agency_id, amadeus_oid, amadeus_originator, amadeus_password, amadeus_queue_number } = req.body;

    if (!agency_id || !amadeus_oid) return res.status(400).json({ error: 'Missing required fields' });

    // 1. Create/Update Config
    const updatePayload = {
        agency_id,
        amadeus_oid,
        amadeus_originator,
        amadeus_queue_number,
        sync_status: 'active'
    };

    // Only update password if provided (it might remain unchanged)
    if (amadeus_password) {
        // Hash it or Encrypt it here. For MVP/Demo we store as is or simple hash.
        // updatePayload.amadeus_password_hash = hash(amadeus_password); 
        updatePayload.amadeus_password_hash = amadeus_password;
    }

    const { data, error } = await supabase
        .from('agency_gds_config')
        .upsert(updatePayload, { onConflict: 'agency_id' })
        .select();

    if (error) return res.status(500).json({ error: error.message });

    // 2. Trigger an immediate sync for testing
    // Run in background
    forceSync().catch(err => console.error("Force sync failed", err));

    res.json({ success: true, message: 'Configuration saved and sync triggered', config: data[0] });
});

export default router;
