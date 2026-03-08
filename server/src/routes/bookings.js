import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getBookings,
    createBooking,
    updateBooking,
    deleteBooking
} from '../controllers/bookingController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBookings);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
