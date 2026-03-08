// server/src/routes/analytics.js
import express from 'express';
import { getProfitabilityStats } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/profitability', getProfitabilityStats);

export default router;
