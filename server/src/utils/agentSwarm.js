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
                    // Check if it's just the basic "Message added" default API response
                    if (text !== "Message added" && text.length > 20) return text;
                } else if (Array.isArray(assistantMessage.content) && assistantMessage.content[0]?.text?.value) {
                    const text = assistantMessage.content[0].text.value;
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
Extract: destination, duration (in days), travelers (number), and any specific tags/vibes (e.g. foodie, luxury).
Return strictly and only valid JSON with keys: destination, duration, travelers, tags.`;

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
                structurerOutput = { destination: "Unknown", duration: 3, travelers: 2, tags: [] };
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
Return strictly valid JSON in this exact format, with no markdown codeblocks:
{
  "title": "A catchy title for the trip",
  "summary": "A 2 sentence summary of the vibe",
  "detailedPlan": {
    "Day 1": { "theme": "...", "activities": ["...", "..."] },
    "Day 2": { "theme": "...", "activities": ["...", "..."] }
  }
}
Ensure you generate exactly ${structurerOutput.duration || 3} days.`;

            const plannerInput = JSON.stringify(structurerOutput, null, 2);

            let plannerOutput;
            try {
                this.onAgentThought('planner', 'Generating geographical routing via Backboard API...');
                let rawPlan = await this.callBackboardAssistant("Planner Agent", plannerPrompt, plannerInput);
                rawPlan = rawPlan.replace(/```json|```/g, '').trim();
                plannerOutput = JSON.parse(rawPlan);
                this.onAgentThought('planner', `Generated itinerary: ${plannerOutput.title || 'Untitled'} with ${Object.keys(plannerOutput.detailedPlan || {}).length} days.`);
                this.onAgentComplete('planner', plannerOutput);
            } catch (err) {
                throw new Error("Planner Agent failed to generate valid JSON: " + err.message);
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
Output strictly valid JSON (no markdown):
{
  "passed": boolean,
  "score": number (0-100),
  "flags": ["array of any warnings or constraint violations"],
  "finalApproval": "A short 1-sentence approval message"
}`;

            const verifierInput = `Original Requirements: ${JSON.stringify(structurerOutput)}\nGenerated Plan: ${JSON.stringify(plannerOutput)}`;

            let verifierOutput;
            try {
                this.onAgentThought('verifier', 'Checking logic and constraints via Backboard API...');
                let rawVer = await this.callBackboardAssistant("Verifier Agent", verifierPrompt, verifierInput);
                rawVer = rawVer.replace(/```json|```/g, '').trim();
                verifierOutput = JSON.parse(rawVer);
                this.onAgentThought('verifier', `Validation complete. Score: ${verifierOutput.score}/100. Flags: ${verifierOutput.flags?.length || 0}`);
                this.onAgentComplete('verifier', verifierOutput);
            } catch (err) {
                throw new Error("Verifier Agent failed: " + err.message);
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
