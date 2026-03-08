import express from 'express';
import { search, importResort } from '../controllers/resortController.js';

const router = express.Router();

// GET /api/resorts/search?destination=Cancun
router.get('/search', search);

// POST /api/resorts/import
router.post('/import', importResort);

// GET /api/resorts/:id/offers
import { getOffers, deleteResort, getById } from '../controllers/resortController.js';
router.get('/:id/offers', getOffers);
router.delete('/:id', deleteResort);
router.get('/:id', getById); // Must be last to avoid conflicts with 'search' etc

export default router;
