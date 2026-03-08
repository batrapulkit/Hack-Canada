// server/src/routes/agencies.js
import express from 'express';
import {
  getAgency,
  updateAgency,
  uploadBrandingAsset,
  getAgencyStats
} from '../controllers/agencyController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

// Use multer for logo upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Get agency profile
router.get('/', authenticate, getAgency);

// Update agency info (name, contact, etc.)
router.patch('/', authenticate, updateAgency);

// Upload agency branding assets (logo, letterhead)
router.post('/upload-asset', authenticate, upload.single('file'), uploadBrandingAsset);

// Get aggregated stats (clients, leads, revenue)
router.get('/stats', authenticate, getAgencyStats);

export default router;
