import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
});

/**
 * POST /api/social/generate-post
 * Generates an optimized LinkedIn post for a travel agent based on a recent booking.
 * Uses Gemini AI as the content engine (Stan-style AI content generation).
 */
router.post('/generate-post', async (req, res) => {
    try {
        const { destination, duration, travelers, budget, agencyName, agentName } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const prompt = `
You are a professional LinkedIn content strategist for a B2B travel agency. 
Generate a compelling, authentic LinkedIn post for a travel agent who just finalized a client itinerary.

Details:
- Destination: ${destination}
- Duration: ${duration || 'N/A'} days
- Travelers: ${travelers || 'N/A'} people
- Agent/Agency: ${agentName || agencyName || 'Travel Professional'}

Rules:
1. Sound authentic — not salesy or corporate
2. Include 1-2 relatable travel insights or tips about the destination
3. End with a soft call-to-action (e.g., "DM me if you're planning a trip here!")
4. Use 3-5 relevant hashtags (e.g., #TravelAgent #LuxuryTravel #${destination.replace(/\s/g, '')})
5. Keep it under 250 words, conversational LinkedIn tone
6. Include 1-2 tasteful emojis
7. DO NOT mention prices

Return ONLY the post text, no preamble or explanation.`;

        const result = await model.generateContent(prompt);
        const postText = result.response.text().trim();

        console.log(`[Stan/Social] Generated LinkedIn post for: ${destination}`);

        res.json({
            success: true,
            post: postText,
            destination,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Stan/Social] Error generating post:', error);
        res.status(500).json({ error: 'Failed to generate LinkedIn post' });
    }
});

export default router;
