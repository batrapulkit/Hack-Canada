import { searchResorts, importExternalResort, getResortOffers } from '../services/resortService.js';
import { supabase } from '../config/supabase.js';

export const search = async (req, res) => {
    try {
        const { destination, budget_level, interests, amenities } = req.query;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const criteria = {
            destination,
            budget_level: budget_level ? parseInt(budget_level) : undefined,
            interests: interests ? interests.split(',') : [],
            amenities: amenities ? amenities.split(',') : [],
            adults: req.query.adults ? parseInt(req.query.adults) : 2,
            children: req.query.children ? parseInt(req.query.children) : 0,
            agency_id: req.user ? req.user.agency_id : undefined
        };

        const results = await searchResorts(criteria);
        res.json(results);

    } catch (error) {
        console.error('Resort Search Controller Error:', error);
        res.status(500).json({
            error: 'Failed to search resorts',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const importResort = async (req, res) => {
    try {
        const resortData = req.body;
        if (!resortData || !resortData.name) {
            return res.status(400).json({ error: 'Invalid resort data' });
        }

        // Import Logic
        // We need to import the service function dynamically or add it to imports
        // (See imports at top of file)
        // For now I will assume I updated imports below/above.
        // Actually I need to update imports first.
        // I'll do it in this block safely.

        // Call Service
        // const { importExternalResort } = await import('../services/resortService.js');
        const internalId = await importExternalResort(resortData);

        res.json({ success: true, id: internalId });

    } catch (error) {
        console.error('Import Resort Error:', error);
        res.status(500).json({
            error: 'Failed to import resort',
            details: error.message || error.toString()
        });
    }
};

export const getOffers = async (req, res) => {
    try {
        const { id } = req.params;
        const agency_id = req.user ? req.user.agency_id : undefined;

        // Dynamic Import of Service
        // const { getResortOffers } = await import('../services/resortService.js');
        const offers = await getResortOffers(id, agency_id);

        res.json(offers);
    } catch (error) {
        console.error('Get Offers Error:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
};

export const deleteResort = async (req, res) => {
    try {
        const { id } = req.params;
        // Import Supabase
        // const { supabase } = await import('../config/supabase.js');

        const { error } = await supabase.from('resorts').delete().eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Resort Error:', error);
        res.status(500).json({ error: 'Failed to delete resort' });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('resorts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Resort not found' });

        res.json(data);
    } catch (error) {
        console.error('Get Resort By ID Error:', error);
        res.status(500).json({
            error: 'Failed to fetch resort details',
            details: error.message,
            code: error.code // Postgres error code
        });
    }
};
