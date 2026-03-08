import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AgentSwarm } from '../utils/agentSwarm.js';

dotenv.config();

const router = express.Router();

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: call Gemini natively (Backboard API DNS is currently down)
// ─────────────────────────────────────────────────────────────────────────────
const callGemini = async (systemPrompt, userMessage) => {
    if (!GEMINI_API_KEY) throw new Error("No Gemini API key configured.");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
    return result.response.text().trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /history — stub (Backboard handles memory server-side)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
    res.json({ history: [] });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /message — AI Copilot chat with client context memory
// ─────────────────────────────────────────────────────────────────────────────
router.post('/message', async (req, res) => {
    try {
        const { message, clientId } = req.body;

        let clientContext = '';
        if (clientId) {
            const { data } = await supabase
                .from('clients')
                .select('name, email, notes, travel_preferences')
                .eq('id', clientId)
                .single();
            if (data) {
                clientContext = `Client: ${data.name} (${data.email}). Notes: ${data.notes || 'None'}. Preferences: ${data.travel_preferences || 'None'}.`;
            }
        }

        const systemPrompt = `You are an expert B2B travel agent AI copilot with persistent memory. Help the travel agent with client management, itinerary advice, upsell recommendations, and booking insights. Be concise and professional.${clientContext ? `\n\nClient context: ${clientContext}` : ''}`;

        if (!GEMINI_API_KEY) {
            return res.json({
                reply: "AI Copilot ready! (Add GEMINI_API_KEY to enable full AI responses)",
                memory_updated: false,
            });
        }

        const reply = await callGemini(systemPrompt, message);
        console.log('[Copilot] Reply generated.');
        res.json({ reply, memory_updated: true });

    } catch (error) {
        console.error('[Copilot] Error:', error.message);
        res.json({
            reply: "I'm the AI Copilot. Temporarily unavailable — please try again.",
            memory_updated: false,
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /verify-plan — Backboard AI keyword verification for an itinerary
//
// Extracts key travel keywords from the plan text and validates them:
//   • Destinations (real locations)
//   • Activities (feasibility)
//   • Logistics (timing, duration, accommodation)
//   • Risk flags (weather, seasonality, political)
//
// Body: { itineraryText, destination, duration }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-plan', async (req, res) => {
    try {
        const { itineraryText, destination, duration } = req.body;

        if (!itineraryText && !destination) {
            return res.status(400).json({ error: 'itineraryText or destination is required' });
        }

        const planText = itineraryText || `${duration}-day trip to ${destination}`;

        const systemPrompt = `You are a professional travel plan verification AI. Your job is to read a travel itinerary, extract the key travel keywords, and validate each one.

For each keyword you find, assess:
- "valid": true/false — is this realistic/accurate?
- "confidence": "high" | "medium" | "low"
- "note": a brief note (max 10 words) if there's a concern, otherwise null

Return ONLY valid JSON in this exact format:
{
  "keywords": [
    { "term": "keyword", "category": "destination|activity|logistics|accommodation", "valid": true, "confidence": "high", "note": null }
  ],
  "overall_score": 0-100,
  "flags": ["any risk flags as strings"],
  "recommendation": "one sentence summary"
}

Do not output markdown, backticks, or explanations. Only raw JSON.`;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'AI key not configured' });
        }

        console.log('[Verify] Verifying plan keywords via Gemini...');
        const raw = await callGemini(systemPrompt, planText);

        let parsed;
        try {
            parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch {
            console.error('[Verify] Failed to parse JSON response:', raw);
            return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
        }

        console.log(`[Verify] Score: ${parsed.overall_score}/100 | Keywords: ${parsed.keywords?.length}`);

        res.json({
            success: true,
            source: 'gemini',
            ...parsed,
        });

    } catch (error) {
        console.error('[Verify] Error:', error.message);
        res.status(500).json({ error: 'Plan verification failed. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Agentic Orchestration Stream (SSE)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agentic-planning', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter q' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (type, data) => {
        res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const swarm = new AgentSwarm({
            onAgentStart: (agent, message) => sendEvent('agent_start', { agent, message }),
            onAgentThought: (agent, message) => sendEvent('agent_thought', { agent, message }),
            onAgentComplete: (agent, result) => sendEvent('agent_complete', { agent, result }),
            onError: (error) => sendEvent('error', { message: error })
        });

        const finalResult = await swarm.run(q);

        sendEvent('done', finalResult);
        res.end();
    } catch (error) {
        console.error('[AgentSwarm] Error:', error);
        sendEvent('error', { message: error.message || 'The Agent Swarm encountered a fatal error.' });
        res.end();
    }
});

export default router;
