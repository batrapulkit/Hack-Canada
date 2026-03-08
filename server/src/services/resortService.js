import { supabase } from '../config/supabase.js';
import AmadeusEnterpriseService from '../services/amadeusEnterpriseService.js';
import { getModel } from '../config/gemini.js';

// Lazy instantiation to ensure env vars are loaded (System Level User)
let systemAmadeusServiceInstance = null;

async function getAmadeusService(agencyId) {
    // 1. If Agency ID provided, try to fetch custom config
    if (agencyId) {
        const { data: config } = await supabase
            .from('agency_gds_config')
            .select('*')
            .eq('agency_id', agencyId)
            .single();

        if (config && config.amadeus_client_id && config.amadeus_client_secret) {
            // Return a specific instance for this agency
            // (We could cache this by agencyId if needed, but for now fresh is safer)
            return new AmadeusEnterpriseService({
                amadeus_client_id: config.amadeus_client_id,
                amadeus_client_secret: config.amadeus_client_secret,
                amadeus_url: config.amadeus_environment === 'production'
                    ? 'https://api.amadeus.com'
                    : 'https://test.api.amadeus.com'
            });
        }
    }

    // 2. Fallback to System Default (Environment Variables)
    if (!systemAmadeusServiceInstance) {
        systemAmadeusServiceInstance = new AmadeusEnterpriseService({
            amadeus_client_id: process.env.AMADEUS_API_KEY || process.env.AMADEUS_CLIENT_ID,
            amadeus_client_secret: process.env.AMADEUS_SECRET || process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_SECRET_KEY,
            amadeus_url: process.env.AMADEUS_URL || 'https://test.api.amadeus.com'
        });
    }
    return systemAmadeusServiceInstance;
}

/**
 * Weighted Scoring Algorithm for Resort Ranking
 */
export async function searchResorts(criteria) {
    const {
        destination,
        dates, // { start, end }
        travelers,
        agency_id
    } = criteria;

    console.log(`[ResortService] Searching: ${destination} | Dates: ${dates?.start}-${dates?.end} | Pax: ${travelers}`);

    console.log(`[ResortService] Searching for: ${destination}`);

    // 1. Fetch Candidates from DB
    let query = supabase
        .from('resorts')
        .select('*')
        .ilike('location', `%${destination}%`)
        .order('rating', { ascending: false });

    let { data: resorts, error } = await query;

    if (error) {
        console.error("[ResortService] DB Error:", error);
        return [];
    }

    if (!resorts || resorts.length < 5) {
        // Fallback or Augment with Amadeus
        try {
            // Need a City Code (e.g., CUN for Cancun). 
            // Since destination is a string name string like "Cancun", we might need to search for the city code first or use a known list.
            // For now, let's assume destination might be a city code or we treat it as loose search if Amadeus supports it 
            // (Amadeus Hotel List By City requires IATA City Code).
            // NOTE: In a real app, we'd have a City Lookup. For this demo, let's try to map or pass "CUN" if the user searched "Cancun"
            // Or rely on the frontend passing a code.

            // Heuristic: If destination is 3 caps, treat as code. Else, skip or try generic mapping.
            let cityCode = null;
            if (destination && destination.length === 3 && destination === destination.toUpperCase()) {
                cityCode = destination;
            } else if (destination && destination.toLowerCase().includes('cancun')) {
                cityCode = 'CUN';
            } else if (destination && destination.toLowerCase().includes('paris')) {
                cityCode = 'PAR';
            } else if (destination && destination.toLowerCase().includes('new york')) {
                cityCode = 'NYC';
            } else if (destination && destination.toLowerCase().includes('london')) {
                cityCode = 'LON';
            } else if (destination && destination.toLowerCase().includes('dubai')) {
                cityCode = 'DXB';
            }

            // Dynamic Fallback: If not in static map, ask Amadeus to find the city code
            if (!cityCode && destination) {
                console.log(`[ResortService] Resolving city code for: ${destination}`);
                const service = await getAmadeusService(agency_id);
                cityCode = await service.searchCity(destination);
                if (cityCode) console.log(`[ResortService] Resolved ${destination} -> ${cityCode}`);
            }

            if (cityCode) {
                console.log(`[ResortService] Fetching external hotels for ${cityCode} from Amadeus...`);
                // Call Amadeus
                const service = await getAmadeusService(agency_id);
                const amadeusHotels = await service.searchHotels(cityCode);

                if (amadeusHotels && amadeusHotels.length > 0) {

                    // Synthetic Assets for Demo/MVP to look "Real"
                    const CITY_IMAGES = {
                        'LON': [
                            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', // London Eye
                            'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=800&q=80', // Big Ben
                            'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=800&q=80', // London Street
                            'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80'  // London Bridge
                        ],
                        'PAR': [
                            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', // Eiffel
                            'https://images.unsplash.com/photo-1499856871940-a09627c6d7db?auto=format&fit=crop&w=800&q=80'  // Paris Street
                        ],
                        'NYC': [
                            'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', // NYC Skyline
                            'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=800&q=80'  // NYC Building
                        ]
                    };

                    const GENERIC_IMAGES = [
                        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
                    ];

                    const availableAnImages = CITY_IMAGES[cityCode] || GENERIC_IMAGES;

                    const GENERIC_AMENITIES = ['WiFi', 'Pool', 'Restaurant', 'Bar', 'Concierge'];

                    // Transform to Resort Schema
                    const externalResorts = amadeusHotels.map(h => {
                        const starRating = h.rating ? parseInt(h.rating) : 3;
                        // Synthetic Sentiment: Base score derived from Stars + Random Variance
                        // New Formula: (Star * 18) + Random(0-15) -> 3 Stars = 54+15=69 max. 4 Stars = 72+15=87. 5 Stars = 90+10=100.
                        // We clamp between 60% and 99%.
                        const variance = Math.floor(Math.random() * 15);
                        const rawScore = Math.min(99, Math.max(60, (starRating * 18) + variance));
                        const synthSentiment = parseFloat((rawScore / 100).toFixed(2));

                        // Deterministic image selection based on hotel ID char code to keep it stable
                        const imgIndex = h.hotelId.charCodeAt(h.hotelId.length - 1) % availableAnImages.length;

                        return {
                            id: `amd_${h.hotelId}`, // Virtual ID
                            name: h.name,
                            location: cityCode,
                            country: h.address?.countryCode || '',
                            description: `Amadeus Property: ${h.name}. Chain: ${h.chainCode || 'N/A'}. Located in ${cityCode}.`,
                            amenities: GENERIC_AMENITIES,
                            tags: ['External', 'Amadeus', 'Live'],
                            price_level: Math.min(5, Math.max(2, starRating)),
                            rating: starRating,
                            sentiment_score: synthSentiment, // Use our synthetic score
                            image_url: availableAnImages[imgIndex],
                            current_currency: 'USD',
                            is_external: true, // CRITICAL: Flags frontend to import this before details
                            external_id: h.hotelId
                        };
                    });

                    // Merge (avoid duplicates if any)
                    // Simple concat for now since IDs are different
                    if (!resorts) resorts = [];
                    resorts = [...resorts, ...externalResorts];
                }
            }
        } catch (extErr) {
            console.warn("Failed to fetch external resorts:", extErr);
        }
    }

    // Safety check if still empty
    if (!resorts || resorts.length === 0) {
        console.log(`[ResortService] No resorts found. Asking Gemini AI for real suggestions in ${destination}...`);
        resorts = await generateFallbackResorts(destination, criteria);
    }

    // 2. Score
    return rankResorts(resorts, criteria);
}

/**
 * Pure Function for Ranking (Testable)
 */
export function rankResorts(resorts, criteria) {
    const {
        budget_level,
        interests = [],
        amenities = []
    } = criteria;

    const scoredResorts = resorts.map(resort => {
        let score = 0;
        const debugLog = [];

        // A. Rating Score (Maximize impact of high ratings)
        score += (Number(resort.rating) * 5);
        if (resort.rating >= 4.5) debugLog.push("Top Rated Property");
        else if (resort.rating >= 4) debugLog.push("Highly Rated");

        // B. Sentiment Bonus (+/- 10 points max)
        if (resort.sentiment_score) {
            score += (Number(resort.sentiment_score) * 10);
            if (resort.sentiment_score > 0.9) debugLog.push("Exceptional Guest Sentiment");
            else if (resort.sentiment_score > 0.8) debugLog.push("Strong Positive Reviews");
        }

        // C. Tag Matching (High Weight)
        if (interests && interests.length > 0) {
            const resortTags = (resort.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
            let matches = 0;
            interests.forEach(interest => {
                if (resortTags.some(tag => tag.includes(interest.toLowerCase()))) {
                    score += 15;
                    matches++;
                }
            });
            if (matches > 0) debugLog.push(`Matches Interest: ${interests[0]}`);
        }

        // D. Budget Fit
        if (budget_level) {
            const diff = (resort.price_level || 2) - budget_level;
            if (diff === 0) {
                score += 10;
                debugLog.push("Perfect Budget Match");
            } else if (diff < 0) {
                score += 5; // Under budget is good
                debugLog.push("Great Value (Under Budget)");
            } else {
                score -= (diff * 10); // Over budget penalizes heavily
            }
        }

        // E. Amenities
        if (amenities && amenities.length > 0) {
            const resortAmenities = (resort.amenities || []).map(a => typeof a === 'string' ? a.toLowerCase() : '');
            let amMatches = 0;
            amenities.forEach(am => {
                if (resortAmenities.some(r => r.includes(am.toLowerCase()))) {
                    score += 2;
                    amMatches++;
                }
            });
            score += (amMatches * 2);
            debugLog.push(`Amenity Matches (${amMatches}): +${amMatches * 2}`);
        }

        return {
            ...resort,
            score,
            match_details: debugLog
        };
    });

    // 3. Sort by Score
    scoredResorts.sort((a, b) => b.score - a.score);

    // 4. Limit to Top 5 (Curation Mode)
    return scoredResorts.slice(0, 5);
}

/**
 * Import an external resort into the local DB
 */
export async function importExternalResort(resortData) {
    console.log(`[ResortService] Importing external resort: ${resortData.name}`);
    console.log(`[ResortService] Incoming Payload hotelId: ${resortData.hotelId}`);

    // 1. Check for existing by External ID (hotelId) or Name+Location
    // We'll trust Name + Location for now if no external_id column known.
    // Ideally we add 'external_id' column to resorts table.
    // For this MVP, we will try to find a match.

    // Check if we have an Amadeus ID
    const amadeusId = resortData.external_id || resortData.hotelId; // e.g. "HLLON123"

    // Try to find if we already imported this.
    // We can store the amadeusId in 'description' or a specific column.
    // Let's assume we match by Name for simplicity in this MVP.
    const { data: existing } = await supabase
        .from('resorts')
        .select('id')
        .eq('name', resortData.name)
        .eq('location', resortData.location)
        .limit(1)
        .maybeSingle();

    if (existing) {
        return existing.id;
    }

    // 2. Insert new
    // Try inserting with all fields first
    const fullResort = {
        name: resortData.name,
        location: resortData.location,
        country: resortData.country || '',
        description: resortData.description || '',
        amenities: resortData.amenities || [],
        tags: resortData.tags || [],
        price_level: parseInt(resortData.price_level) || 3,
        rating: parseFloat(resortData.rating) || 0,
        sentiment_score: parseFloat(resortData.sentiment_score) || 0,
        image_url: resortData.image_url,
        external_id: resortData.external_id || resortData.hotelId // May fail if column missing
    };

    try {
        const { data: inserted, error } = await supabase
            .from('resorts')
            .insert(fullResort)
            .select()
            .single();

        if (error) throw error;
        return inserted.id;

    } catch (err) {
        console.warn("[ResortService] Full insert failed, trying legacy fallback...", err.message);

        // Fallback: Remove columns that might not exist in old schema
        const legacyResort = { ...fullResort };
        delete legacyResort.external_id;
        delete legacyResort.sentiment_score;

        const { data: legacyData, error: legacyError } = await supabase
            .from('resorts')
            .insert(legacyResort)
            .select()
            .single();

        if (legacyError) {
            // Second Fallback: Minimal Insert (Maybe tags/amenities format issue?)
            console.warn("[ResortService] Legacy insert failed. Trying minimal insert...", legacyError.message);
            const minimalResort = {
                name: resortData.name,
                location: resortData.location,
                description: resortData.description || '',
                price_level: parseInt(resortData.price_level) || 3,
                rating: parseFloat(resortData.rating) || 0,
                image_url: resortData.image_url,
                // Ensure tags/amenities are simplistic if DB expects text[] vs json
                tags: resortData.tags || [],
                amenities: resortData.amenities || []
            };

            const { data: minData, error: minError } = await supabase
                .from('resorts')
                .insert(minimalResort)
                .select()
                .single();

            if (minError) throw minError; // Give up
            return minData.id;
        }

        return legacyData.id;
    }


}

/**
 * Fetch Live Offers for a Resort
 */
export async function getResortOffers(resortId, agencyId) {
    // 1. Get Resort External ID
    const { data: resort, error } = await supabase
        .from('resorts')
        .select('external_id, name, location')
        .eq('id', resortId)
        .single();

    if (error || !resort || !resort.external_id) {
        console.log(`[ResortService] No external ID for resort ${resortId}. Skipping live fetch.`);
        return [];
    }

    // 2. Check if this is an AI/Mock Resort (Don't call Amadeus)
    if (resort.external_id.startsWith('gemini_') || resort.external_id.startsWith('mock_') || resort.external_id.startsWith('ai_')) {
        // Generate dynamic, context-aware offers using Gemini
        console.log(`[ResortService] Generating AI offers for ${resort.name}...`);
        return await generateGeminiResortDetails(resort.name, resort.location, resortId);
    }

    // 3. Call Amadeus for Real Resorts
    try {
        const service = await getAmadeusService(agencyId);

        // Default dates: +30 days, 5 nights
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 30);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 5);

        const offers = await service.getHotelOffers(
            [resort.external_id],
            checkIn.toISOString().split('T')[0],
            checkOut.toISOString().split('T')[0],
            2
        );

        if (!offers || offers.length === 0) return [];

        const hotelOffers = offers[0].offers || [];

        return hotelOffers.map(offer => {
            return {
                id: `live_${offer.id}`,
                resort_id: resortId,
                name: offer.room?.typeEstimated?.category || offer.room?.description?.text || "Standard Room",
                description: offer.room?.description?.text || "Live Rate from Amadeus",
                price: parseFloat(offer.price?.total) || 0,
                currency: offer.price?.currency || 'USD',
                duration_days: 5,
                inclusions: ["Live Availability", "Instant Confirmation"],
                is_live: true
            };
        });
    } catch (err) {
        console.warn(`[ResortService] Failed to fetch live offers for ${resort.external_id}:`, err.message);
        return [];
    }
}

/**
 * Generate REAL resort suggestions using Gemini AI
 * Replaces synthetic data with actual intelligent recommendations
 */
async function generateFallbackResorts(destination, criteria = {}) {
    const { budget_level, interests = [], amenities = [], adults = 2, children = 0 } = criteria;

    try {
        console.log(`[ResortService] Asking Gemini for resorts in ${destination}...`);

        // 1. Get Model
        const model = getModel('gemini-2.5-flash');

        // 2. prompt
        const prompt = `You are a luxury travel agent.
        The user wants to go to "${destination}".
        Travelers: ${adults} Adults, ${children} Children.
        Interests: ${interests.join(', ') || 'General Luxury, Relaxation'}.
        Amenities: ${amenities.join(', ') || 'Pool, Spa'}.
        Budget Level: ${budget_level || 3} (Scale 1-5).

        Task: Suggest 5 REAL, highly-rated resorts/hotels in ${destination} that match these criteria.
        
        Return STRICT JSON array with objects:
        {
            "name": "Resort Name",
            "description": "2 sentence description highlighting why it matches.",
            "price_level": (integer 1-5),
            "rating": (float 3.0-5.0),
            "sentiment_score": (float 0.80-0.99),
            "match_details": ["Reason 1", "Reason 2"],
            "amenities": ["Wifi", "Pool", ...],
            "tags": ["Tag1", "Tag2"]
        }
        
        IMPORTANT:
        - Do NOT invent fake resorts. Use real ones.
        - Ensure JSON is valid.`;

        // 3. Generate
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Clean & Parse JSON
        // Gemini might wrap in markdown ```json ... ```
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const resortsData = JSON.parse(jsonStr);

        // 5. Enhance with IDs and Images
        // Since Gemini doesn't return real images easily without search tool, we use high-quality placeholders or basic mapping.
        // For MVP, we stick to our nice Unsplash placeholders but with REAL names.

        const images = [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-6e53ce41e887?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80'
        ];

        return resortsData.map((r, i) => ({
            ...r,
            id: `ai_real_${i}_${Date.now()}`, // Unique ID
            location: destination,
            country: 'Travel Destination',
            is_external: true, // Treat as external for "Import" flow
            external_id: `gemini_rec_${i}_${Date.now()}`, // Ensure DB uniqueness to prevent collisions
            image_url: images[i % images.length],
            // Ensure schema compliance
            price_level: r.price_level || 3,
            rating: r.rating || 4.5,
            sentiment_score: r.sentiment_score || 0.9,
            match_details: r.match_details || ["AI Recommended"]
        }));

    } catch (error) {
        console.error("Gemini Resort Generation Failed:", error);
        // Fallback to the old synthetic static list if Gemini fails (e.g. quota)
        // Re-implement simplified static fallback here or just return empty
        return [];
    }
}

/**
 * Generate specific, realistic offers for an AI resort using Gemini
 */
async function generateGeminiResortDetails(resortName, location, resortId) {
    try {
        const model = getModel('gemini-2.5-flash');
        const prompt = `You are a hotel inventory manager.
        Create 3 realistic vacation packages/room offers for: "${resortName}" located in "${location}".
        
        Return STRICT JSON array:
        [
            {
                "name": "Room Type Name (e.g. Ocean View Suite)",
                "description": "Attractive description of the room and perks.",
                "price": (integer 1500-5000),
                "inclusions": ["List", "of", "4", "perks"]
            }
        ]
        Do not include markdown formatting.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const offers = JSON.parse(text);

        return offers.map((o, i) => ({
            id: `ai_offer_${resortId}_${i}_${Date.now()}`,
            resort_id: resortId,
            name: o.name,
            description: o.description,
            price: o.price,
            currency: 'USD',
            duration_days: 5,
            inclusions: o.inclusions || ["WiFi", "Breakfast"],
            is_live: false
        }));

    } catch (error) {
        console.error("Gemini Offer Gen Failed:", error);
        // Fallback to generic if AI fails
        return [
            {
                id: `ai_fallback_${Date.now()}`,
                resort_id: resortId,
                name: "Standard Luxury Room",
                description: "Enjoy a comfortable stay with excellent amenities.",
                price: 2000,
                currency: 'USD',
                duration_days: 5,
                inclusions: ["Breakfast", "WiFi"],
                is_live: false
            }
        ];
    }
}
