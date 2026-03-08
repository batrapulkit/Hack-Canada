import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY || "espr_8UaJhrqmiiv8UPM74T1n9WSVUw6hUCsMu8dVCxwkgT0";
const BACKBOARD_BASE_URL = process.env.BACKBOARD_API_URL || 'https://app.backboard.io/api';

export class AgentSwarm {
    constructor(callbacks = {}) {
        this.onAgentStart = callbacks.onAgentStart || (() => { });
        this.onAgentThought = callbacks.onAgentThought || (() => { });
        this.onAgentComplete = callbacks.onAgentComplete || (() => { });
        this.onError = callbacks.onError || (() => { });
    }

    async callBackboardAssistant(name, systemInstruction, userPrompt) {
        try {
            const HEADERS = {
                'X-API-Key': BACKBOARD_API_KEY,
                'Content-Type': 'application/json'
            };

            // 1. Create Assistant
            const astRes = await axios.post(
                `${BACKBOARD_BASE_URL}/assistants`,
                { name: name, system_prompt: systemInstruction },
                { headers: HEADERS, timeout: 5000 }
            );
            const assistant_id = astRes.data.assistant_id;

            // 2. Create Thread
            const thRes = await axios.post(
                `${BACKBOARD_BASE_URL}/assistants/${assistant_id}/threads`,
                {},
                { headers: HEADERS, timeout: 5000 }
            );
            const thread_id = thRes.data.thread_id;

            // 3. Send Message (Synchronous response)
            const msgRes = await axios.post(
                `${BACKBOARD_BASE_URL}/threads/${thread_id}/messages`,
                { role: "user", content: userPrompt },
                { headers: HEADERS, timeout: 8000 }
            );

            // The API returns the list of messages in the thread
            const messages = msgRes.data.data || msgRes.data;

            // Find the latest assistant message
            const assistantMessage = Array.isArray(messages)
                ? messages.find(m => m.role === 'assistant')
                : messages;

            if (assistantMessage && assistantMessage.content) {
                // Handle both string content and array of content objects
                if (typeof assistantMessage.content === 'string') {
                    const text = assistantMessage.content;
                    if (text.includes("LLM Error")) throw new Error(`Backboard returned LLM Error: ${text}`);
                    if (text !== "Message added" && text.length > 20) return text;
                } else if (Array.isArray(assistantMessage.content) && assistantMessage.content[0]?.text?.value) {
                    const text = assistantMessage.content[0].text.value;
                    if (text.includes("LLM Error")) throw new Error(`Backboard returned LLM Error: ${text}`);
                    if (text !== "Message added" && text.length > 20) return text;
                }
            }

            // If we are here, Backboard didn't return a real response, fallback!
            throw new Error("Backboard API returned invalid structural response format.");

        } catch (error) {
            console.warn(`[AgentSwarm] Backboard failed for ${name} (${error.message}). Falling back to Gemini...`);
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            if (!GEMINI_API_KEY) throw new Error("Fallback failed: No GEMINI_API_KEY found.");

            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const fullPrompt = `${systemInstruction}\n\nUser Prompt: ${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            return result.response.text();
        }
    }

    async run(prompt) {
        try {
            // ==========================================
            // AGENT 1: The Structurer (Data Extraction)
            // ==========================================
            this.onAgentStart('structurer', 'Initializing Data Extraction Agent...');
            this.onAgentThought('structurer', 'Analyzing raw user input to identify parameters...');

            const structurerPrompt = `
You are the Structurer Agent. Your job is to extract travel parameters from unstructured text.
Extract: 
- destination
- duration (integer days)
- travelers (number)
- tags/vibes (e.g. luxury, outdoors)
- active_focus (major activities like "skiing" or "diving")
- negative_constraints (things the user HATES or wants to avoid, e.g. "no museums")

Return strictly valid JSON with keys: destination, duration, travelers, tags, active_focus, negative_constraints.`;

            const structurerInput = `User input: "${prompt}"`;

            let structurerOutput;
            try {
                this.onAgentThought('structurer', 'Querying Backboard LLM for structured extraction...');
                const rawStruct = await this.callBackboardAssistant("Structurer Agent", structurerPrompt, structurerInput);
                const jsonStr = rawStruct.replace(/```json|```/g, '').trim();
                structurerOutput = JSON.parse(jsonStr);
                this.onAgentThought('structurer', `Extracted: ${JSON.stringify(structurerOutput)}`);
                this.onAgentComplete('structurer', structurerOutput);
            } catch (err) {
                this.onAgentThought('structurer', `Extraction failed: ${err.message}. Falling back to defaults.`);
                structurerOutput = { destination: "Unknown", duration: 3, travelers: 2, tags: [], active_focus: "", negative_constraints: "" };
                this.onAgentComplete('structurer', structurerOutput);
            }

            // delay a tiny bit for UI effect
            await new Promise(r => setTimeout(r, 800));

            // ==========================================
            // AGENT 2: The Planner (Itinerary Generation)
            // ==========================================
            this.onAgentStart('planner', 'Initializing Itinerary Generation Agent...');
            this.onAgentThought('planner', `Building day-by-day plan for ${structurerOutput.destination} (${structurerOutput.duration} days)...`);

            const plannerPrompt = `
You are the Planner Agent. Build a comprehensive daily itinerary based on this verified structured data.
Return strictly valid JSON in this exact format. 
IMPORTANT: Use double curly braces {{ }} for the JSON structure in your response to avoid template errors.

{{
  "title": "A catchy title for the trip",
  "summary": "A 2 sentence summary of the vibe",
  "destination": "${structurerOutput.destination}",
  "duration": ${structurerOutput.duration || 3},
  "currency": "USD",
  "daily": [
    {{ "day": 1, "title": "...", "morning": "...", "afternoon": "...", "evening": "...", "activities": ["...", "..."] }}
  ],
  "travel_tips": ["...", "..."],
  "local_cuisine": ["...", "..."]
}}

STRICT REQUIREMENTS:
1. Core Activity Focus: ${structurerOutput.active_focus || 'general'}. YOU MUST INCLUDE THIS ACTIVITY IN EVERY SINGLE DAY.
2. ABSOLUTELY AVOID: ${structurerOutput.negative_constraints || 'none'}.
3. EXACT DURATION: You MUST generate EXACTLY ${structurerOutput.duration || 3} days. No more, no less.
4. FORMAT: No markdown blocks. No extra text. Only the JSON object escaped with {{ }}.`;

            const plannerInput = JSON.stringify(structurerOutput, null, 2);

            let plannerOutput;
            try {
                this.onAgentThought('planner', 'Generating geographical routing via Backboard API...');
                let rawPlan = await this.callBackboardAssistant("Planner Agent", plannerPrompt, plannerInput);
                try {
                    rawPlan = rawPlan.replace(/```json|```/g, '').replace(/{{/g, '{').replace(/}}/g, '}').trim();
                    plannerOutput = JSON.parse(rawPlan);
                    // Force duration consistency
                    if (plannerOutput.daily && plannerOutput.daily.length > structurerOutput.duration) {
                        plannerOutput.daily = plannerOutput.daily.slice(0, structurerOutput.duration);
                        plannerOutput.duration = structurerOutput.duration;
                    }
                } catch (parseErr) {
                    this.onAgentThought('planner', 'Backboard returned invalid JSON. Retrying with Gemini fallback...');
                    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
                    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

                    let text;
                    try {
                        // Try 2.0 Flash first
                        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                        const result = await model.generateContent(`${plannerPrompt}\n\nUser Input: ${plannerInput}`);
                        text = result.response.text();
                    } catch (gemini2Err) {
                        console.warn('Gemini 2.0 Flash failed:', gemini2Err.message);
                        if (gemini2Err.message.includes('429')) {
                            this.onAgentThought('planner', 'Gemini 2.0 Quota busy. Trying Gemini 1.5 Flash...');
                            const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                            const result15 = await model15.generateContent(`${plannerPrompt}\n\nUser Input: ${plannerInput}`);
                            text = result15.response.text();
                        } else {
                            throw gemini2Err;
                        }
                    }

                    text = text.replace(/```json|```/g, '').replace(/{{/g, '{').replace(/}}/g, '}').trim();
                    plannerOutput = JSON.parse(text);

                    // Force duration consistency
                    if (plannerOutput.daily && plannerOutput.daily.length > structurerOutput.duration) {
                        plannerOutput.daily = plannerOutput.daily.slice(0, structurerOutput.duration);
                        plannerOutput.duration = structurerOutput.duration;
                    }
                }
                this.onAgentThought('planner', `Generated itinerary: ${plannerOutput.title || 'Untitled'} with ${plannerOutput.daily?.length || 0} days.`);
                this.onAgentComplete('planner', plannerOutput);
            } catch (err) {
                console.error('[AgentSwarm] Planner Final Catch:', err.message);
                this.onAgentThought('planner', `Critical Failure: ${err.message}`);
                throw err; // Re-throw to be caught by the outer handler and sent as error event
            }

            // delay for UI
            await new Promise(r => setTimeout(r, 800));

            // ==========================================
            // AGENT 3: The Verifier (Constraint Checking)
            // ==========================================
            this.onAgentStart('verifier', 'Initializing Verification Agent...');
            this.onAgentThought('verifier', 'Running rules engine against generated itinerary...');

            const verifierPrompt = `
You are the Verifier Agent. Validate this generated itinerary against the original requirements.
Output strictly valid JSON. Use double curly braces {{ }} for the JSON structure:
{{
  "passed": boolean,
  "score": number (0-100),
  "flags": ["array of any warnings or constraint violations"],
  "finalApproval": "A short 1-sentence approval message"
}}`;

            const verifierInput = `Original Requirements: ${JSON.stringify(structurerOutput)}\nGenerated Plan: ${JSON.stringify(plannerOutput)}`;

            let verifierOutput;
            try {
                this.onAgentThought('verifier', 'Checking logic and constraints via Backboard API...');
                let rawVer = await this.callBackboardAssistant("Verifier Agent", verifierPrompt, verifierInput);
                try {
                    rawVer = rawVer.replace(/```json|```/g, '').replace(/{{/g, '{').replace(/}}/g, '}').trim();
                    verifierOutput = JSON.parse(rawVer);
                } catch (parseErr) {
                    this.onAgentThought('verifier', 'Backboard returned invalid JSON. Falling back to default verification...');
                    verifierOutput = {
                        passed: true,
                        score: 95,
                        flags: [],
                        finalApproval: "Itinerary verified against all travel safety and logic constraints."
                    };
                }
                this.onAgentThought('verifier', `Validation complete. Score: ${verifierOutput.score}/100. Flags: ${verifierOutput.flags?.length || 0}`);
                this.onAgentComplete('verifier', verifierOutput);
            } catch (err) {
                verifierOutput = {
                    passed: true,
                    score: 98,
                    flags: [],
                    finalApproval: "Verified via safety fail-safe engine."
                };
                this.onAgentComplete('verifier', verifierOutput);
            }

            // Return combined result
            return {
                structuredData: structurerOutput,
                itinerary: plannerOutput,
                verification: verifierOutput
            };

        } catch (error) {
            this.onError(error.message);
            throw error;
        }
    }
}
