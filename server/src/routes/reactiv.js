import express from 'express';
import { generateCheckoutQrCode } from '../services/reactivService.js';

const router = express.Router();

/**
 * POST /api/reactiv/generate-qr
 *
 * Body: { itineraryId, packageName, price, description }
 *
 * Sends the raw itinerary text to Backboard.io (with Gemini fallback),
 * gets the best-matching product tag and checkout URL, then returns
 * a QR code data URI encoding that checkout URL.
 */
router.post('/generate-qr', async (req, res) => {
    try {
        const { itineraryId, packageName, price, description } = req.body;

        if (!itineraryId || !packageName) {
            return res.status(400).json({ error: 'Missing required itinerary fields' });
        }

        // Build a rich itinerary text string for the AI to classify
        const itinerary_text = [
            packageName,
            description || '',
        ].filter(Boolean).join('\n');

        const { qrDataUri, tag, checkoutUrl } = await generateCheckoutQrCode(
            itineraryId,
            itinerary_text
        );

        if (!qrDataUri) {
            return res.status(500).json({ error: 'Failed to generate QR Code' });
        }

        return res.json({
            success: true,
            qrCode: qrDataUri,
            campaignTag: tag,
            checkoutUrl,
        });

    } catch (error) {
        console.error('[Reactiv Route] Error:', error);
        return res.status(500).json({ error: 'Failed to generate checkout QR' });
    }
});

export default router;
