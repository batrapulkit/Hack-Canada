import express from 'express';
import { redeemCoupon } from '../controllers/couponController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // Protect all coupon routes

router.post('/redeem', redeemCoupon);

export default router;
