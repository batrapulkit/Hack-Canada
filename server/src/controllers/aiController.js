// server/src/controllers/aiController.js
import { getModel, getSearchEnabledModel } from '../config/gemini.js';
import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../services/emailService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { searchResorts } from '../services/resortService.js';
import { getNextInvoiceNumber } from '../utils/invoiceNumberGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../../debug.log');

function logToFile(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
}

/* simplified system prompt */
const SYSTEM_PROMPT = `You are TONO, Triponic B2B's AI assistant. Be helpful, professional, and concise.
Capabilities: Create itineraries, invoices, answer app questions, SEND EMAILS, perform CRM updates.
If the user asks to create something, I handle automation. You just acknowledge it friendly.
IMPORTANT: Speak naturally. Do NOT return JSON.`;

/* intent detection uses model to parse user message into fields */
export async function detectIntent(message) {
  logToFile(`Detecting intent for: ${message}`);

  // --- 0. HEURISTIC GUARD RAILS (Save Tokens & Increase Speed) ---
  const lower = message.toLowerCase();

  // HEURISTIC: Pending/Upcoming Trips
  if (
    (lower.includes('pending') || lower.includes('upcoming') || lower.includes('future') || lower.includes('active')) &&
    (lower.includes('trip') || lower.includes('itinerar') || lower.includes('plan'))
  ) {
    console.log('[Heuristic] Detected "Pending Trips" query.');
    // Extract client name naively if "for [Name]" exists
    let clientName = null;
    // Regex matches: "for" + optional (a/the/client/mr/mrs) + NAME
    const forMatch = lower.match(/for\s+(?:a\s+|the\s+|client\s+|mr\.?\s+|mrs\.?\s+|ms\.?\s+)?([a-z\s]+)/i);
    if (forMatch) {
      // Clean up any trailing punctuation or " please"
      clientName = forMatch[1].replace(/[?.!]/g, '').replace(' please', '').trim();
    }

    return {
      intent: 'query',
      query_entity: 'itinerary',
      query_detail: 'pending',
      client_name: clientName
    };
  }

  // HEURISTIC: Unpaid Invoices
  if (
    (lower.includes('unpaid') || lower.includes('outstanding') || lower.includes('due')) &&
    (lower.includes('invoice') || lower.includes('payment'))
  ) {
    console.log('[Heuristic] Detected "Unpaid Invoices" query.');
    return {
      intent: 'query',
      query_entity: 'invoice',
      query_detail: 'unpaid'
    };
  }

  const model = getModel();

  const prompt = `
Extract fields from the message:
"${message}"

Return ONLY JSON:
{ 
  "intent": "itinerary|edit_itinerary|invoice|booking|proposal|query|email_action|create_client|update_client|general", 
  "client_name": "string|null", 
  "client_details": { "email": "string|null", "phone": "string|null", "notes": "string|null" }, 
  "follow_up_instruction": "string|null", 
  "destination": "string|null", 
  "duration": "string|null", 
  "dates": "string|null", 
  "itinerary_id": "string|null",
  "edit_instruction": "string|null",
  "invoice_amount": "number|null",
  "invoice_description": "string|null",
  "query_entity": "invoice|client|itinerary|null",
  "query_detail": "unpaid|due_dates|upcoming|email|count|pending|null",
  "email_type": "reminder|proposal|invoice|general|null",
  "trip_type": "business|family|honeymoon|couples|friends|solo|other",
  "travelers": "string|number|null",
  "budget": "string|null",
  "preferences": "string|null"
}

Note: 
- Use "itinerary" for creating new trips.
- Use "query" if user asks for data (e.g. "pending trips", "unpaid invoices", "show me...").
- Use "email_action" if user wants to SEND something.
- "query_entity": "itinerary" if asking about trips/plans. "client" if asking about people. "invoice" if asking about money.
- "query_detail": "pending" if asking for "pending", "active", "current" trips.
- "travelers": extract exact count or description (e.g. "kids aged 8 and 10", "2 adults").
- "budget": extract strictly if mentioned (e.g. "luxury", "cheap", "5k").
- "preferences": extract constraints like "stay near X", "vegetarian", "free evenings".
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const usage = response.usageMetadata;
  if (usage) {
    console.log(`Token Usage (Intent): P=${usage.promptTokenCount} R=${usage.candidatesTokenCount} T=${usage.totalTokenCount}`);
    logToFile(`Token Usage (Intent): ${JSON.stringify(usage)}`);
  }
  const raw = response.text().trim();
  try {
    // Clean up markdown code blocks if present
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRaw);
  } catch (err) {
    // fallback safe default
    return { intent: 'general', client_name: null, destination: null, duration: null, dates: null };
  }
}

/* Fetch Agency Preferences based on past confirmed trips (Agency Memory) */
async function getAgencyPreferences(agencyId, destination) {
  if (!destination) return '';

  try {
    // 1. Search for CONFIRMED or BOOKED trips to this destination
    const { data: pastTrips } = await supabase
      .from('itineraries')
      .select('details')
      .eq('agency_id', agencyId)
      .or('status.eq.confirmed,status.eq.booked')
      .ilike('destination', `%${destination}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!pastTrips || pastTrips.length === 0) return '';

    // 2. Extract Hotels & Activities
    const hotels = new Set();
    const activities = new Set();

    pastTrips.forEach(trip => {
      if (!trip.details || !trip.details.detailedPlan) return;
      const plan = trip.details.detailedPlan;

      // Preferred Hotel
      if (plan.hotel && plan.hotel.name) hotels.add(plan.hotel.name);

      // Activities
      if (plan.dailyPlan && Array.isArray(plan.dailyPlan)) {
        plan.dailyPlan.forEach(day => {
          if (day.activities && Array.isArray(day.activities)) {
            // Just take top 2 activities per day to avoid noise
            day.activities.slice(0, 2).forEach(act => activities.add(act));
          }
        });
      }
    });

    if (hotels.size === 0 && activities.size === 0) return '';

    const hotelStr = Array.from(hotels).join(', ');
    const actStr = Array.from(activities).slice(0, 8).join(', '); // Limit detailed activities

    return `
    AGENCY MEMORY (Past Successes in ${destination}):
    - The agency has previously BOOKED/CONFIRMED these hotels: ${hotelStr}.
    - Popular activities booked: ${actStr}.
    - PRIORITIZE these options if they fit the current budget/requirements.
    `;

  } catch (err) {
    console.warn('Failed to fetch agency preferences:', err);
    return '';
  }
}

/* create a day-wise itinerary via model (returns JSON object or fallback text) */
export async function createDayWiseItinerary({ destination, duration, interests, travelers, budget, client, trip_type, preferences, agencyPreferences, currency, include_accommodation }) {
  // Use Search Enabled Model for real-time pricing
  const model = getSearchEnabledModel();
  const daysNum = parseInt((String(duration).match(/\d+/) || [duration])[0] || 1, 10);
  const clientLocation = client?.address || "unknown"; // Assuming address contains city or we default
  const currencyCode = currency || 'USD';

  // 0. SEARCH RANKED RESORTS (Anti-Gravity)
  let recommendedResorts = [];
  try {
    // Only search resorts if accommodation is desired
    if (include_accommodation !== false) {
      // Map budget string to level (simple heuristic)
      let budgetLevel = 2; // Moderate default
      const b = String(budget || '').toLowerCase();  // Convert to string first to handle numeric budgets
      if (b.includes('luxury') || b.includes('high') || b.includes('expensive')) budgetLevel = 4;
      else if (b.includes('cheap') || b.includes('low') || b.includes('budget')) budgetLevel = 1;
      else if (b.includes('premium')) budgetLevel = 3;

      const ranked = await searchResorts({
        destination,
        budget_level: budgetLevel,
        interests: Array.isArray(interests) ? interests : [interests],
        amenities: preferences ? [preferences] : []
      });

      if (ranked && ranked.length > 0) {
        // Select top 3
        recommendedResorts = ranked.slice(0, 3);
        console.log(`[AI] Selected Top ${recommendedResorts.length} Resorts: ${recommendedResorts.map(r => r.name).join(', ')}`);
      }
    }
  } catch (err) {
    console.error("[AI] Resort Search Failed:", err);
  }

  const resortInstructions = (include_accommodation !== false)
    ? (recommendedResorts.length > 0
      ? `- **MANDATORY**: I have found these specific best-match hotels. Use them as options: 
           ${recommendedResorts.map(r => `"${r.name}" in ${r.location} (Price Level: ${r.price_level}/4, Rating: ${r.rating}, Amenities: ${JSON.stringify(r.amenities)})`).join('; ')}.
           Structure them into the "accommodation_options" array.`
      : `- Search for 3 distinct "Hotels in ${destination}" matching the budget (${budget}). Pick REAL hotels.`)
    : `- **NO ACCOMMODATION**: The user requested an activity-only itinerary. DO NOT include hotels or accommodation options. Leave "hotel" and "accommodation_options" fields empty or null. Focus heavily on activities.`;

  const prompt = `You are an AI travel planner. Generate a complete trip itinerary.

Trip Details:
- Destination: ${destination}
- Duration: ${daysNum} days
- Trip Type: ${trip_type || 'General'}
- Travelers: ${travelers || 1}
- Budget: ${budget || 'moderate'}
- Interests: ${Array.isArray(interests) ? interests.join(', ') : interests || 'general'}
- Specific Preferences: ${preferences || 'None'}
- User City: ${clientLocation}
- Currency: ${currencyCode}
${agencyPreferences || ''}

Detailed Instructions:
- **CRITICAL: USE GOOGLE SEARCH to find REAL-TIME availability and prices for FLIGHTS.**
${resortInstructions}
- Search for "Flights from ${clientLocation} to ${destination}" for the next month. Use the REAL price found in ${currencyCode}.
- If Trip Type is "Business", ensure free time/evenings are noted for dinners if requested, and hotel is practical.
- If Trip Type is "Family", ensure activities are kid-friendly if ages are mentioned.
- Respect specific preferences strictly (e.g. "Near Canary Wharf", "Vegetarian").

Return ONLY valid JSON:


{
  "content": "Welcome message (50-80 words)",
  "detailedPlan": {
    "destination": "${destination}",
    "description": "Description (40-60 words)",
    "thumbnail": "Landmark name",
    "duration": "${daysNum} days",
    "travelers": ${travelers || 1},
    "budget": "${budget || 'moderate'}",
    "interest": "${Array.isArray(interests) ? interests.join(', ') : interests || 'general'}",
    "totalCost": "Calculate total estimated cost based on real flight/hotel prices found",
    "flights": { "departure": "${clientLocation}", "price": "ACTUAL PRICE found via search in ${currencyCode}", "airline": "Real Airline found", "duration": "Duration" },
    "accommodation_options": [
        { "name": "Hotel Name", "location": "Area", "price": "Price per night/total in ${currencyCode}", "rating": 4.5, "amenities": ["WiFi"], "reason": "Why this is a good fit" },
        { "name": "Alternative Hotel", "location": "Area", "price": "Price in ${currencyCode}", "rating": 4.2, "amenities": [], "reason": "Alternative choice" }
    ],
    "hotel": { "name": "Primary Choice Name", "location": "Area", "price": "Price in ${currencyCode}", "rating": 4.5, "amenities": ["WiFi"] },
    "dailyPlan": [
      {
        "day": 1,
        "title": "Day title",
        "description": "Brief description",
        "activities": ["Activity 1", "Activity 2", "Activity 3", "Activity 4"],
        "activitiesDescription": ["Detail 1 (30-40 words)", "Detail 2", "Detail 3", "Detail 4"],
        "travelTips": ["Tip 1", "Tip 2"],
        "meals": { "breakfast": "Suggestion", "lunch": "Suggestion", "dinner": "Suggestion" },
        "notes": "Notes",
        "image": "Landmark",
        "weather": "Weather",
        "transport": "Transport"
      }
    ],
    "weather": { "temp": "XX-XX°C", "condition": "Condition", "recommendation": "What to pack" }
  },
  "suggestions": ["Tip 1", "Tip 2", "Tip 3"]
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const usage = response.usageMetadata;
  if (usage) {
    console.log(`Token Usage (Itinerary Gen): P=${usage.promptTokenCount} R=${usage.candidatesTokenCount} T=${usage.totalTokenCount}`);
    logToFile(`Token Usage (Itinerary Gen): ${JSON.stringify(usage)}`);
  }
  const raw = response.text();
  // parse attempt
  try {
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRaw);
  } catch (err) {
    const match = raw.match(/(\{[\s\S]*\})/);
    if (match) {
      try { return JSON.parse(match[1]); } catch (_) { /* continue */ }
    }
    // fallback to a simple object with raw text in first day
    return {
      content: raw.slice(0, 200),
      detailedPlan: {
        destination,
        duration: `${daysNum} days`,
        dailyPlan: [{ day: 1, title: 'Day 1', description: raw.slice(0, 200), activities: [], meals: {}, notes: '' }]
      }
    };
  }
}

/* Edit an existing itinerary using LLM */
async function editItinerary(currentJson, instruction) {
  const model = getModel();
  const prompt = `
You are an expert travel planner.
I have an existing itinerary JSON:
${JSON.stringify(currentJson, null, 2)}

User Instruction: "${instruction}"

Please modify the JSON to reflect the user's instruction.
Ensure the structure remains EXACTLY the same.
Return ONLY the modified valid JSON.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const usage = response.usageMetadata;
  if (usage) {
    console.log(`Token Usage (Edit): P=${usage.promptTokenCount} R=${usage.candidatesTokenCount} T=${usage.totalTokenCount}`);
    logToFile(`Token Usage (Edit): ${JSON.stringify(usage)}`);
  }
  const raw = response.text();
  try {
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRaw);
  } catch (err) {
    console.error('Failed to parse edited JSON', err);
    return null;
  }
}


/* Parse booking details from a screenshot (Vision API) */
export async function parseBookingScreenshot(req, res) {
  try {
    const { image, generateItinerary = true } = req.body; // Expecting base64 string + optional flag
    if (!image) {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }

    // Clean base64 header if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Use Flash model which supports multimodal
    const model = getSearchEnabledModel();

    const prompt = `
    Analyze this screenshot of a travel booking (flight, hotel, or itinerary).
    Extract the following details into a strict JSON format.
    
    If the image is NOT a booking or travel document, set "valid": false.

    Required Fields:
    - destination (city/country)
    - start_date (YYYY-MM-DD or null)
    - end_date (YYYY-MM-DD or null) - IMPORTANT: Look for return flight dates
    - budget (total cost if visible, as a number, or null)
    - currency (detected currency code, e.g. USD, GBP, CAD)
    
    Optional Details (if visible):
    - flights: { airline, flight_number, departure_time, arrival_time, departure_city, arrival_city } (Array if multiple)
    - hotel: { name, check_in, check_out, address }
    - travelers: (count or names)
    - booking_reference: confirmation number

    Return JSON:
    {
      "valid": true/false,
      "confidence": "high|medium|low",
      "data": {
        "destination": "...",
        "start_date": "...",
        "end_date": "...",
        "budget": 1234.50,
        "currency": "USD",
        "flights": [],
        "hotel": {},
        "travelers": [],
        "booking_reference": "..."
      }
    }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png", // generic fallback, model is robust
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    let jsonResponse;
    try {
      const cleanRaw = text.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResponse = JSON.parse(cleanRaw);
    } catch (parseErr) {
      console.warn("Vision API returned unstructured text, attempting fallback regex...");
      // Fallback: Regex extraction for basic fields if JSON fails
      const destinationMatch = text.match(/destination[:\s]+([a-zA-Z\s,]+)/i);
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);

      jsonResponse = {
        valid: true, // Assuming valid if we got text, but low confidence
        confidence: "low",
        data: {
          destination: destinationMatch ? destinationMatch[1].trim() : null,
          start_date: dateMatch ? dateMatch[0] : null,
          budget: null
        }
      };
    }

    // **NEW: Auto-generate complete itinerary if requested**
    if (generateItinerary && jsonResponse.valid && jsonResponse.data.destination) {
      try {
        const { destination, start_date, end_date, budget, currency, flights, hotel, travelers } = jsonResponse.data;

        // Calculate duration from dates
        let duration = 1;
        if (start_date && end_date) {
          const start = new Date(start_date);
          const end = new Date(end_date);
          const diffTime = Math.abs(end - start);
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
        } else if (start_date) {
          // If only start date, default to 3 days
          duration = 3;
        }

        console.log(`[Vision AI] Generating ${duration}-day itinerary for ${destination}`);

        // Generate complete itinerary
        const itineraryJson = await createDayWiseItinerary({
          destination,
          duration: `${duration} days`,
          interests: [],
          travelers: travelers?.length || travelers || 2,
          budget: budget || 'moderate',
          client: null, // Guest mode
          trip_type: 'general',
          preferences: null,
          agencyPreferences: '',
          currency: currency || 'USD',
          include_accommodation: !!hotel // Include accommodation if hotel detected
        });

        // Merge flight info into Day 1 if we have flights
        if (flights && flights.length > 0 && itineraryJson.detailedPlan?.dailyPlan) {
          const flight = flights[0];
          const flightInfo = `**Your Flight**: ${flight.airline || 'Airline'} ${flight.flight_number || ''} departing ${flight.departure_time || 'TBD'} from ${flight.departure_city || 'origin'}`;

          // Update Day 1
          if (itineraryJson.detailedPlan.dailyPlan[0]) {
            itineraryJson.detailedPlan.dailyPlan[0].morning = flightInfo + '\n\n' + (itineraryJson.detailedPlan.dailyPlan[0].morning || '');
            itineraryJson.detailedPlan.dailyPlan[0].title = `Arrival in ${destination}`;
          }
        }

        // Add itinerary to response
        jsonResponse.itinerary = itineraryJson;
        jsonResponse.duration = duration;

      } catch (itineraryErr) {
        console.error("Failed to generate itinerary from screenshot:", itineraryErr);
        // Don't fail the entire request, just skip itinerary generation
        jsonResponse.itinerary_error = "Could not generate itinerary automatically";
      }
    }

    return res.json({ success: true, ...jsonResponse });

  } catch (error) {
    console.error("Screenshot Parse Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to analyze screenshot",
      details: error.message
    });
  }
}

/* MAIN chat endpoint — will auto-create itineraries when intent says so */
export const chatWithAI = async (req, res) => {
  try {
    const { message, conversation_history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const intentData = await detectIntent(message);
    const { intent, client_name, client_details, follow_up_instruction, destination, duration, edit_instruction, invoice_amount, invoice_description, trip_type, travelers, budget, preferences } = intentData;

    // Normalize intent
    const normalizedIntent = (intent === 'create_itinerary' || intent === 'plan_trip') ? 'itinerary' : intent;


    // --- CREATE ITINERARY ---
    if (normalizedIntent === 'itinerary') {
      // 0. CHECK & ENFORCE QUOTA
      // Get current credits
      const { data: agency, error: agencyErr } = await supabase
        .from('agencies')
        .select('itinerary_credits')
        .eq('id', req.user.agency_id)
        .single();

      if (agencyErr) {
        console.error("Failed to check agency credits:", agencyErr);
        return res.status(500).json({ error: "Failed to verify account limits" });
      }

      const credits = agency?.itinerary_credits !== undefined ? agency.itinerary_credits : 0; // Default 0 if null, though migration sets 5

      if (credits <= 0) {
        return res.json({
          success: true,
          response: "You have reached your itinerary generation limit (0 credits remaining). Please upgrade your plan or redeem a coupon to continue planning trips."
        });
      }

      let client = null;

      // 1. Resolve Client
      // If no client name specified, default to "any" (random) or NULL
      const isRandomRequest = client_name && (client_name.toLowerCase().includes('any') || client_name.toLowerCase().includes('random'));

      if (isRandomRequest) {
        // Fetch a random client
        const { data: randomClients } = await supabase
          .from('clients')
          .select('*')
          .eq('agency_id', req.user.agency_id)
          .limit(1);

        if (randomClients && randomClients.length > 0) client = randomClients[0];
      } else if (client_name) {
        // Find specific client
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .ilike('full_name', `%${client_name}%`) // e.g. "Snow Monkey Logistics"
          .eq('agency_id', req.user.agency_id);

        if (clients && clients.length > 0) {
          client = clients[0];
        } else {
          // Fallback: Try searching for just the first word
          const firstWord = client_name.split(' ')[0];
          let foundCandidate = false;

          if (firstWord.length > 2) {
            const { data: candidates } = await supabase
              .from('clients')
              .select('*')
              .ilike('full_name', `%${firstWord}%`)
              .eq('agency_id', req.user.agency_id)
              .limit(1);

            if (candidates && candidates.length > 0) {
              client = candidates[0];
              foundCandidate = true;
            }
          }

          if (!foundCandidate) {
            // User instruction: "if there is no client name it should make a default trip"
            console.log(`Client '${client_name}' not found. Proceeding with general itinerary (guest mode).`);
            client = null;
          }
        }
      }

      // If no client found, we proceed with NO CLIENT (client = null).

      if (!destination || !duration) {
        const forWho = client ? ` for ${client.full_name}` : '';
        return res.json({ success: true, response: `Creating a trip${forWho}. What is the destination and duration? (e.g. "5 days in Paris")` });
      }

      let aiJson;
      let aiText;
      const daysNum = parseInt((String(duration).match(/\d+/) || [duration])[0] || 1, 10);

      // 1. Check if we already have an itinerary for this destination in this agency
      const { data: existingItineraries } = await supabase
        .from('itineraries')
        .select('*')
        .ilike('destination', destination) // exact or case-insensitive match
        .eq('duration', daysNum) // strict match on duration
        .eq('agency_id', req.user.agency_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingItineraries && existingItineraries.length > 0) {
        // REUSE & UPDATE CHECK
        const candidate = existingItineraries[0];
        const candidateJson = candidate.ai_generated_json;

        // Robustness: Verify the JSON content actually has the correct number of days
        const actualDays = candidateJson?.detailedPlan?.dailyPlan?.length;

        if (actualDays === daysNum) {
          console.log(`Found existing itinerary for ${destination} (${daysNum} days). Updating based on new prompt to ensure changes are applied...`);

          // Use the existing plan as a base, but APPLY the new user instructions (message)
          // This ensures if the user added "vegetarian" or "cheaper", it gets factored in.
          try {
            // Pass the raw user message as the instruction
            const updatedJson = await editItinerary(candidateJson, message);

            if (updatedJson) {
              aiJson = updatedJson;
              // If the update changed the description, use it, otherwise fallback
              aiText = updatedJson.content || (updatedJson.detailedPlan && updatedJson.detailedPlan.description) || candidate.ai_generated_content;
            } else {
              console.log("Update failed, falling back to generating new itinerary.");
            }
          } catch (updateErr) {
            console.error("Error updating existing itinerary:", updateErr);
            // Fallback to generating new will happen since aiJson is still undefined
          }

        } else {
          console.log(`Found existing itinerary ${candidate.id} but content length (${actualDays}) mismatch requested (${daysNum}). Generating new.`);
          // Fallthrough to GENERATE NEW logic
        }
      }

      if (!aiJson) {
        // GENERATE NEW
        try {
          // Anti-Gravity: Agency Memory
          const agencyPrefs = await getAgencyPreferences(req.user.agency_id, destination);

          aiJson = await createDayWiseItinerary({
            destination,
            duration,
            interests: client?.interests || [],
            travelers: travelers || 1,
            budget: budget || client?.budget_range,
            client,
            trip_type,
            preferences,
            agencyPreferences: agencyPrefs,
            currency: intentData.currency || 'USD',
            include_accommodation: intentData.include_accommodation
          });

          aiText = aiJson.content || (aiJson.detailedPlan && aiJson.detailedPlan.description) || "Itinerary created.";
        } catch (genError) {
          console.error("AI Generation Error:", genError);
          return res.json({ success: true, response: "I'm sorry, I encountered an error while generating the itinerary plan. Please try again." });
        }
      }

      // save to DB
      const { data: saved, error } = await supabase
        .from('itineraries')
        .insert({
          destination,
          duration: aiJson.detailedPlan?.duration ? parseInt(aiJson.detailedPlan.duration) : parseInt((String(duration).match(/\d+/) || [duration])[0] || 1, 10),
          ai_generated_content: aiText,
          ai_generated_json: aiJson, // Store the full new structure
          client_id: client?.id || null,
          agency_id: req.user.agency_id,
          created_by: req.user.id,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // DEDUCT CREDIT
      try {
        await supabase
          .from('agencies')
          .update({ itinerary_credits: credits - 1 })
          .eq('id', req.user.agency_id);
      } catch (creditErr) {
        console.error("Failed to deduct credit, but itinerary created", creditErr);
      }

      // success response
      return res.json({
        success: true,
        action: 'itinerary_created',
        itinerary_id: saved.id,
        response: `Itinerary created${client ? ' for ' + client.full_name : ''}. Destination: ${destination}.`,
        raw: aiJson
      });
    }

    // --- CREATE INVOICE ---
    if (intent === 'invoice') {
      if (!client_name) {
        return res.json({ success: true, response: "Who should I create the invoice for?" });
      }

      // 1. Find Client
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .ilike('full_name', `%${client_name}%`)
        .eq('agency_id', req.user.agency_id);

      if (!clients || clients.length === 0) {
        return res.json({ success: true, response: `I couldn't find a client named "${client_name}".` });
      }
      // Use the best match (first one)
      const client = clients[0];

      // If amount is provided explicitely, bypass intelligent lookup and just create it (Old Logic)
      if (invoice_amount) {
        const invoiceNumber = await getNextInvoiceNumber(req.user.agency_id);
        // ... (Existing database creation logic) ...
        const { data: invoice, error: invError } = await supabase
          .from('invoices')
          .insert({
            agency_id: req.user.agency_id,
            client_id: client.id,
            total: parseFloat(invoice_amount),
            subtotal: parseFloat(invoice_amount),
            status: 'draft',
            invoice_number: invoiceNumber,
            created_by: req.user.id,
            created_at: new Date().toISOString(),
            notes: invoice_description || 'AI Generated Invoice',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select().single();

        if (invError) {
          console.error("AI Invoice Error", invError);
          return res.json({ success: true, response: "Failed to create invoice record." });
        }

        await supabase.from('invoice_items').insert({
          invoice_id: invoice.id,
          description: invoice_description || 'Professional Services (AI Generated)',
          quantity: 1,
          unit_price: parseFloat(invoice_amount),
          amount: parseFloat(invoice_amount)
        });

        return res.json({
          success: true,
          action: 'invoice_created',
          invoice_id: invoice.id,
          response: `Invoice #${invoiceNumber} created for ${client.full_name} for $${invoice_amount}.`
        });
      }

      // 2. Intelligent Lookup: Check for recent trips
      const { data: recentTrips } = await supabase
        .from('itineraries')
        .select('*')
        .eq('client_id', client.id)
        .eq('agency_id', req.user.agency_id)
        .order('created_at', { ascending: false })
        .limit(5);

      const trips = recentTrips || [];

      // Logic: If exactly 1 trip matches and has a budget -> Auto Create
      if (trips.length === 1) {
        const trip = trips[0];
        // Try to parse budget "10000" or "Luxury" (NaN)
        const budgetNum = parseFloat(trip.budget);

        if (!isNaN(budgetNum) && budgetNum > 0) {
          // AUTO CREATE
          const invoiceNumber = await getNextInvoiceNumber(req.user.agency_id);
          const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert({
              agency_id: req.user.agency_id,
              client_id: client.id,
              total: budgetNum,
              subtotal: budgetNum,
              status: 'draft',
              invoice_number: invoiceNumber,
              created_by: req.user.id,
              created_at: new Date().toISOString(),
              notes: `Invoice for Trip to ${trip.destination}`,
              due_date: trip.start_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select().single();

          if (!invError) {
            await supabase.from('invoice_items').insert({
              invoice_id: invoice.id,
              description: `Trip Package: ${trip.destination} (${trip.duration} days)`,
              quantity: 1,
              unit_price: budgetNum,
              amount: budgetNum
            });

            return res.json({
              success: true,
              action: 'invoice_created', // Frontend will show toast
              invoice_id: invoice.id,
              response: `I found one trip to ${trip.destination}. I've automatically created Invoice #${invoiceNumber} for $${budgetNum}.`
            });
          }
        }
      }

      // Fallback: Open Builder with Prefill Data
      return res.json({
        success: true,
        action: 'open_invoice_builder',
        response: `Opening the invoice builder for ${client.full_name}...`,
        data: {
          client: client,
          suggested_trips: trips
        }
      });
    }

    // --- CREATE CLIENT ---
    if (intent === 'create_client') {
      const { client_name, client_details, follow_up_instruction } = intentData; // Added follow_up_instruction

      if (!client_name) {
        return res.json({ success: true, response: "I need a name to create a new client." });
      }

      // Check if client already exists
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .ilike('full_name', `%${client_name}%`)
        .eq('agency_id', req.user.agency_id);

      if (existingClients && existingClients.length > 0) {
        const client = existingClients[0];
        return res.json({
          success: true,
          action: 'open_client_profile',
          response: `A client named "${client.full_name}" already exists. Opening their profile.`,
          data: {
            client_id: client.id
          }
        });
      }

      // Fallback: Open Builder with Prefill Data
      return res.json({
        success: true,
        action: 'open_client_builder',
        response: `Opening the client form to add ${client_name || 'a new client'}...`,
        data: {
          initialData: {
            name: client_name,
            ...(client_details || {})
          },
          follow_up: follow_up_instruction // Pass the "and then..." instruction
        }
      });
    }

    // --- QUERY DATA ---
    if (intent === 'query') {
      const { query_entity, query_detail } = intentData;

      // 1. INVOICE QUERIES
      if (query_entity === 'invoice') {
        if (query_detail === 'unpaid') {
          const { count, error } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', req.user.agency_id)
            .in('status', ['pending', 'overdue', 'draft']); // defining unpaid loosely as not paid

          if (error) throw error;
          return res.json({ success: true, response: `You have ${count} unpaid invoices.` });
        }

        if (query_detail === 'due_dates' || query_detail === 'upcoming') {
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          let query = supabase
            .from('invoices')
            .select('*, client:clients(full_name)')
            .eq('agency_id', req.user.agency_id)
            .in('status', ['pending', 'overdue']);

          // If specifically asking for "next week", filter by date range
          if (query_detail === 'upcoming') {
            query = query
              .gte('due_date', today.toISOString())
              .lte('due_date', nextWeek.toISOString());
          }

          const { data: dueInvoices } = await query
            .order('due_date', { ascending: true })
            .limit(10);

          if (!dueInvoices || dueInvoices.length === 0) {
            return res.json({ success: true, response: "You have no unpaid invoices due in the upcoming week." });
          }

          const list = dueInvoices.map(inv =>
            `- ${inv.client?.full_name}: $${inv.total} (Due: ${new Date(inv.due_date).toLocaleDateString()})`
          ).join('\n');

          return res.json({ success: true, response: `Here are the invoices due in the next 7 days:\n${list}` });
        }
      }

      // 2. CLIENT QUERIES
      if (query_entity === 'client' && query_detail === 'email' && client_name) {
        const { data: clients } = await supabase
          .from('clients')
          .select('email, full_name')
          .ilike('full_name', `%${client_name}%`)
          .eq('agency_id', req.user.agency_id)
          .limit(1);

        if (clients && clients.length > 0) {
          return res.json({ success: true, response: `The email for ${clients[0].full_name} is: ${clients[0].email}` });
        } else {
          return res.json({ success: true, response: `I couldn't find a client named "${client_name}".` });
        }
      }
    }


    // --- EMAIL ACTIONS (The MOAT: Agentic Behavior) ---
    if (intent === 'email_action') {
      const { email_type, client_name } = intentData;

      // 0. Fetch Agency SMTP Settings
      const { data: agencySettings } = await supabase
        .from('agencies')
        .select('smtp_host, smtp_port, smtp_user, smtp_pass, agency_name')
        .eq('id', req.user.agency_id)
        .single();

      let smtpConfig = null;
      if (agencySettings && agencySettings.smtp_host) {
        smtpConfig = {
          host: agencySettings.smtp_host,
          port: agencySettings.smtp_port,
          user: agencySettings.smtp_user,
          pass: agencySettings.smtp_pass,
          fromName: agencySettings.agency_name
        };
      }

      // Handle generic "send reminders to all unpaid"
      if (email_type === 'reminder' && (!client_name || client_name.toLowerCase().includes('all') || client_name.toLowerCase().includes('unpaid'))) {
        // Fetch all unpaid
        const { data: overdue } = await supabase
          .from('invoices')
          .select('*, client:clients(full_name, email)')
          .eq('agency_id', req.user.agency_id)
          .in('status', ['pending', 'overdue']);

        if (!overdue || overdue.length === 0) {
          return res.json({ success: true, response: "Great news! You have no unpaid invoices to remind anyone about." });
        }

        // "Send" logic (Real)
        const names = overdue.map(i => i.client?.full_name).join(', ');
        const count = overdue.length;
        let sentCount = 0;

        for (const invoice of overdue) {
          if (invoice.client?.email) {
            const subject = `Payment Reminder: Invoice #${invoice.invoice_number}`;
            const text = `Dear ${invoice.client.full_name},\n\nThis is a gentle reminder that invoice #${invoice.invoice_number} for $${invoice.total} is pending. Please arrange payment at your earliest convenience.\n\nThank you,\nTriponic B2B`;
            const result = await sendEmail(invoice.client.email, subject, text, text.replace(/\n/g, '<br>'));
            if (result.success) sentCount++;
          }
        }

        return res.json({
          success: true,
          response: `Done. I've sent payment reminders to ${sentCount} out of ${count} clients: ${names}.`
        });
      }

      // Handle specific client email "Send invoice to John"
      if (client_name) {
        // find client
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .ilike('full_name', `%${client_name}%`)
          .eq('agency_id', req.user.agency_id)
          .limit(1);

        if (!clients || clients.length === 0) {
          return res.json({ success: true, response: `I couldn't find a client named "${client_name}" to email.` });
        }
        const client = clients[0];

        if (email_type === 'invoice') {
          // Find latest invoice
          const { data: latestInv } = await supabase.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1);
          if (!latestInv || latestInv.length === 0) return res.json({ success: true, response: `I couldn't find any recent invoices for ${client.full_name} to send.` });

          // Fetch full invoice with items
          const { data: fullInvoice } = await supabase
            .from('invoices')
            .select('*, invoice_items(*), client:clients(*)')
            .eq('id', latestInv[0].id)
            .single();

          const inv = fullInvoice || latestInv[0];
          const subject = `Invoice #${inv.invoice_number} from ${agencySettings?.agency_name || 'Triponic B2B'}`;
          const text = `Dear ${client.full_name},\n\nPlease find attached invoice #${inv.invoice_number} for $${inv.total}.\n\nThank you for your business.`;

          // Generate PDF
          let attachments = [];
          try {
            // Pass agency settings for branding
            const pdfBuffer = await generateInvoicePDF(inv, agencySettings);
            attachments = [{
              filename: `Invoice-${inv.invoice_number}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }];
            console.log(`[Email] Generated PDF size: ${pdfBuffer.length}`);
          } catch (pdfError) {
            console.error("[Email] Failed to generate PDF:", pdfError);
          }

          const result = await sendEmail(client.email, subject, text, text.replace(/\n/g, '<br>'), smtpConfig, attachments);

          if (result.success) {
            return res.json({ success: true, response: `Sent Invoice #${inv.invoice_number} to ${client.email} with PDF attachment.` });
          } else {
            return res.json({ success: true, response: `Failed to send email to ${client.email}. Please check system logs.` });
          }
        }

        if (email_type === 'proposal') {
          const subject = `Proposal for ${client.full_name}`;
          const text = `Dear ${client.full_name},\n\nHere is the proposal we discussed.\n\nBest regards,\nTriponic B2B`;
          await sendEmail(client.email, subject, text, text.replace(/\n/g, '<br>'));
          return res.json({ success: true, response: `Proposal for ${client.full_name} has been emailed to ${client.email}.` });
        }

        // General
        const subject = `Message from Triponic B2B`;
        const text = `Dear ${client.full_name},\n\nJust reaching out regarding our recent conversation.\n\nBest,\nTriponic B2B`;
        await sendEmail(client.email, subject, text, text.replace(/\n/g, '<br>'));
        return res.json({ success: true, response: `Email sent to ${client.full_name} (${client.email}).` });
      }
    }

    // fallback: simple chat mode (short)
    const model = getModel();
    let historyString = '';
    // Enforce server-side limit: last 6 messages max
    const recentHistory = (conversation_history || []).slice(-6);
    recentHistory.forEach(m => historyString += `${m.role.toUpperCase()}: ${m.content}\n`);

    const prompt = SYSTEM_PROMPT + '\n\n' + historyString + `USER: ${message}\nTONO:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150, // Limit response length for speed/cost
        temperature: 0.7,
      }
    });
    const response = await result.response;
    const usage = response.usageMetadata;
    if (usage) {
      console.log(`Token Usage (Chat): P=${usage.promptTokenCount} R=${usage.candidatesTokenCount} T=${usage.totalTokenCount}`);
      logToFile(`Token Usage (Chat): ${JSON.stringify(usage)}`);
    }
    const reply = response.text();

    // save conversation (best-effort)
    try {
      await supabase.from('ai_conversations').insert({
        user_id: req.user.id,
        agency_id: req.user.agency_id,
        ai_response: reply,
        created_at: new Date().toISOString()
      });
    } catch (dberr) { console.warn('AI conv save failed', dberr); }

    // Include usage in response if available
    // const usage = (await result.response).usageMetadata; 
    // We log usage server-side but do NOT send it to client/agency
    return res.json({ success: true, response: reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('AI controller error:', err);
    logToFile(`AI controller error: ${err.message}\n${err.stack}`);

    if (err.message && err.message.includes('429')) {
      return res.json({ success: true, response: "I'm currently experiencing high traffic (Quota Exceeded). Please try again in a minute." });
    }

    return res.status(500).json({ error: 'AI processing failed', details: err.message });
  }
};

/* PARSE LEAD FROM TEXT (Anti-Gravity) */
export const parseLeadFromText = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text content required' });

  // Define prompt outside the main try block for fallback access
  const prompt = `
    Analyze the following unstructured text and extract lead AND trip information.
    Text: "${text}"

    Return ONLY a JSON object with these exact keys (use null or empty string if not found):
    {
      "full_name": "extracted name",
      "email": "extracted email",
      "phone": "extracted phone",
      "destination": "extracted destination",
      "budget_max": number or null (extract the EXACT numeric value present in text. e.g. "1000 CAD" -> 1000. DO NOT CONVERT TO USD. DO NOT CHANGE THE NUMBER.),
      "currency": "extracted currency code (e.g. USD, INR, EUR). Default to USD if symbol is $ and no context.",
      "budget_approx_usd": number or null (ONLY here: rough conversion to USD integer if currency is not USD),
      "num_adults": number (default 1),
      "num_children": number (default 0),
      "start_date": "YYYY-MM-DD" or null (if year missing, assume next occurrence),
      "end_date": "YYYY-MM-DD" or null (if year missing, assume next occurrence),
      "duration_days": number or null,
      "trip_interests": ["tag1", "tag2"],
      "trip_type": "family|honeymoon|business|adventure|luxury|group|budget" (infer from context, default "family"),
      "notes": "summary of any other important details found in text"
    }
    
    Do not wrap in markdown code blocks. Just valid JSON.
    `;

  try {
    console.log('[AI] Parsing Lead from text...');
    logToFile('[AI] Parsing Lead from text...');

    // 1. Try Primary Model (Lite)
    let raw;
    try {
      const model = getModel(); // Lite
      const result = await model.generateContent(prompt);
      const response = await result.response;
      raw = response.text();
    } catch (primaryErr) {
      console.warn('Primary model failed:', primaryErr.message);
      if (primaryErr.message && primaryErr.message.includes('429')) {
        // 2. Try Fallback Model (Standard Flash)
        console.log('⚠️ Switching to Fallback Model...');
        const fallbackModel = getModel(process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash');
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        raw = response.text();
      } else {
        throw primaryErr;
      }
    }

    // Parse Logic
    const cleanRaw = raw.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    // Extra robustness finding JSON object
    const jsonStart = cleanRaw.indexOf('{');
    const jsonEnd = cleanRaw.lastIndexOf('}');
    let jsonStr = cleanRaw;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = cleanRaw.substring(jsonStart, jsonEnd + 1);
    }

    logToFile(`[AI Parse-Lead] Raw Response: ${raw}`);
    const parsedData = JSON.parse(jsonStr);

    console.log('[AI Parse-Lead] Extracted data:', {
      destination: parsedData.destination,
      duration_days: parsedData.duration_days,
      start_date: parsedData.start_date,
      end_date: parsedData.end_date,
      budget: parsedData.budget_max,
      travelers: `${parsedData.num_adults || 0} adults, ${parsedData.num_children || 0} children`
    });

    return res.json({ success: true, data: parsedData });

  } catch (err) {
    console.error('AI Lead Parse error (Final):', err.message);
    logToFile(`AI Lead Parse error (Final): ${err.message} \n ${err.stack}`);

    if (err.message && err.message.includes('429')) {
      return res.status(429).json({
        error: 'AI Quota Exceeded. Please check your plan.'
      });
    }

    return res.status(500).json({ error: 'AI processing failed', details: err.message });
  }
};

/* GENERATE RESORT SHORTLIST (Anti-Gravity) */
export const generateResortShortlist = async (req, res) => {
  const { request, filters } = req.body;
  // filters: { destination, budget, travelers, type ... }

  if (!request && !filters?.destination) return res.status(400).json({ error: 'Request description or destination required' });

  console.log(`[AI Shortlist] Generating for: "${request}"`);

  try {
    // 1. Semantic Parse (Lite) if request text is provided
    let criteria = filters || {};
    const model = getModel(); // Lite

    if (request) {
      const parsePrompt = `
            Extract ranking criteria from this travel agent request: "${request}"
            Return JSON: { "destination": "string", "budget_level": 1-5, "interests": ["string"], "travelers": "string", "type": "string" }
            If budget is "luxury" -> 4 or 5. If "cheap" -> 1 or 2.
            `;
      const result = await model.generateContent(parsePrompt);
      const raw = (await result.response).text();
      try {
        const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
        criteria = { ...criteria, ...parsed };
        // Ensure valid budget level
        if (criteria.budget_level && typeof criteria.budget_level === 'string') criteria.budget_level = 3;
      } catch (e) { console.warn("Shortlist parse failed", e); }
    }

    // 2. Fetch Candidates (DIRECT - Bypass specific search algo for now)
    // Get ALL resorts (limited to 50 for context window safety) to let AI decide
    const { data: allResorts, error: fetchError } = await supabase
      .from('resorts')
      .select('*')
      .limit(50);

    if (fetchError) throw fetchError;
    const topCandidates = allResorts || [];

    // FORCE GENERATIVE MODE if we have few local resorts (< 5).
    // The user expects "Global Discovery", not just filtering their small local DB.
    if (topCandidates.length < 5) {
      // FALLBACK: Generative AI Mode (Global Knowledge)
      console.log("DB has few items. Returning Generative Suggestions (Global Search).");

      const generativePrompt = `
        User Request: "${request}"
        Internal DB is empty. 
        Task: GENERATE 5 real-world resort recommendations based on your global knowledge that fit this request.
        
        Return JSON:
        {
            "shortlist": [
                {
                    "is_generated": true,
                    "id": "generated_1", 
                    "name": "Resort Name",
                    "location": "City, Country",
                    "description": "Short alluring description.",
                    "amenities": ["Pool", "Spa", "WiFi"],
                    "price_level": 1-5,
                    "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                    "ai_match": {
                        "match_score": 90,
                        "reasoning": "Why this fits...",
                        "recommended_package": { "name": "Standard Rate", "price": 0 }
                    }
                }
            ]
        }
        `;

      const genResult = await model.generateContent(generativePrompt);
      const genRaw = (await genResult.response).text();
      const cleanGen = genRaw.replace(/```json/g, '').replace(/```/g, '').trim();
      const genOutput = JSON.parse(cleanGen);

      return res.json({ success: true, shortlist: genOutput.shortlist || [] });
    }

    // 3. Fetch Packages for these candidates
    const candidateIds = topCandidates.map(c => c.id);
    const { data: allPackages } = await supabase
      .from('packages')
      .select('*')
      .in('resort_id', candidateIds);

    // Map packages to candidates
    const candidatesWithPackages = topCandidates.map(c => ({
      ...c,
      packages: allPackages?.filter(p => p.resort_id === c.id) || []
    }));

    // 4. AI Reasoning & Selection (Standard Model for better reasoning)
    // We feed the resorts + packages to the LLM to pick the best 5

    const selectionPrompt = `
        You are an expert travel consultant.
        User Request: "${request}"
        Parsed Profile: ${JSON.stringify(criteria)}

        Candidate Resorts (JSON):
        ${JSON.stringify(candidatesWithPackages.map(c => ({
      id: c.id,
      name: c.name,
      tags: c.tags,
      price_level: c.price_level,
      packages: c.packages.map(p => ({ name: p.name, price: p.price, desc: p.description }))
    })))}

        Task:
        1. Select the top 5 resorts that best fit the user's explicit and implicit needs.
        2. For each selected resort, pick the **ONE BEST MATCHING PACKAGE** from its list (if available). If no package fits well or list is empty, indicate null or "Standard Stay".
        3. Write a short "Why this fits" reasoning for the agent.

        Return ONLY valid JSON:
        {
            "shortlist": [
                {
                    "resort_id": "uuid",
                    "match_score": 95,
                    "reasoning": "One sentence explanation.",
                    "recommended_package": { "name": "string", "price": number } || null
                }
            ]
        }
        `;

    const selectionResult = await model.generateContent(selectionPrompt);
    const selectionRaw = (await selectionResult.response).text();
    const cleanSelection = selectionRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiOutput = JSON.parse(cleanSelection);

    // Merge AI output with full resort data for the frontend
    const finalShortlist = aiOutput.shortlist.map(item => {
      const fullResort = candidatesWithPackages.find(c => c.id === item.resort_id);
      if (!fullResort) return null;
      return {
        ...fullResort,
        ai_match: item // Contains reasoning & recommended package
      };
    }).filter(Boolean);

    return res.json({ success: true, shortlist: finalShortlist });
  } catch (err) {
    console.error("Shortlist Gen Error:", err);
    return res.status(500).json({ error: "Failed to generate shortlist" });
  }
};

/* ENRICH DESTINATION CONTENT (Tips & Cuisine) */
export async function enrichDestinationContent(destination) {
  if (!destination) return { travel_tips: [], local_cuisine: [] };

  const model = getModel();
  const prompt = `
  You are an expert travel guide.
  For the destination "${destination}", provide:
  1. 3-5 Essential Travel Tips (cultural, logistical, or safety).
  2. 3-5 Local Flavors/Dishes to Try (specific food recommendations).

  Return ONLY valid JSON:
  {
    "travel_tips": ["Tip 1", "Tip 2", "Tip 3"],
    "local_cuisine": ["Dish 1", "Dish 2", "Dish 3"]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const raw = (await result.response).text();
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanRaw);
  } catch (err) {
    console.error(`Failed to enrich destination ${destination}:`, err);
    return { travel_tips: [], local_cuisine: [] };
  }
}
