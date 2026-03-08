import express from 'express';
import { searchFlights } from '../controllers/amadeusController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/search', authenticate, searchFlights);
router.post('/flights', authenticate, searchFlights); // Alias for frontend compatibility

export default router;

