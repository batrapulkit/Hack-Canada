// server/src/controllers/itineraryController.js
import { supabase } from '../config/supabase.js';
import { getModel } from '../config/gemini.js';
import { enrichDestinationContent } from './aiController.js';
import { validatePricing } from '../services/pricingService.js';
import { emitEvent, EVENTS } from '../services/automationEngine.js';

/**
 * Generate itinerary (AI) -> saves both structured JSON (ai_generated_json)
 * and plain text content (ai_generated_content). Links to client_id.
 */
export const generateItinerary = async (req, res) => {
  try {
    const {
      destination,
      duration,
      budget,
      interests,
      travelers,
      accommodation_type,
      client_id,
      start_date,
      end_date,
      currency,
      trip_type, // Added trip_type
      include_accommodation // Added include_accommodation
    } = req.body;



    if (!destination || !duration) {
      return res.status(400).json({ error: 'destination and duration are required' });
    }

    // 0. Check Credits Available
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('usage_count, itinerary_credits')
      .eq('id', req.user.agency_id)
      .single();

    if (agencyError || !agency) {
      return res.status(500).json({ error: 'Failed to fetch agency credits' });
    }

    if ((agency.itinerary_credits || 0) <= 0) {
      return res.status(403).json({
        error: 'No credits remaining',
        message: `You have no itinerary credits remaining. Please purchase more credits or upgrade your plan.`
      });
    }

    // Optional fetch client for personalization
    let client = null;
    if (client_id) {
      const { data: cdata, error: cerr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();
      if (cerr) console.warn('Client load warning:', cerr);
      client = cdata || null;
    }

    // Build a JSON-output prompt (we instruct model to return JSON)
    const daysNum = parseInt((String(duration).match(/\d+/) || [duration])[0] || 1, 10);

    const model = getModel('gemini-2.0-flash');

    const intentPrompt = `
You are an expert travel planner. Produce a DAY-WISE itinerary as valid JSON ONLY.

Input:
- destination: ${destination}
- duration_days: ${daysNum}
- travelers: ${travelers || 1}
- interests: ${Array.isArray(interests) ? interests.join(', ') : interests || 'general'}
- budget: ${budget || 'moderate'} (${currency || 'USD'})
- accommodation: ${accommodation_type || 'hotel'}
- client: ${client ? JSON.stringify({ name: client.full_name, notes: client.notes || '' }) : 'none'}
- dates: ${start_date || ''} to ${end_date || ''}

CRITICAL: You MUST generate EXACTLY ${daysNum} days. The "daily" array must contain EXACTLY ${daysNum} day objects, numbered from 1 to ${daysNum}.

Return ONLY JSON with the following structure:
{
  "title": "Short title",
  "summary": "50-80 word welcome",
  "destination": "City, Country",
  "duration": ${daysNum},
  "currency": "${currency || 'USD'}",
  "estimated_total_cost": "string or number",
  "flights": {...} (optional),
  "hotel": {...} (optional),
  "daily": [
     {
       "day": 1,
       "date": "YYYY-MM-DD (if available)",
       "title": "Day 1 title",
       "morning": "text",
       "afternoon": "text",
       "evening": "text",
       "activities": ["list", "of", "activities"],
       "meals": { "breakfast": "", "lunch": "", "dinner": "" },
       "transport": "text",
       "notes": "text"
     },
     {
       "day": 2,
       "date": "YYYY-MM-DD (if available)",
       "title": "Day 2 title",
       "morning": "text",
       "afternoon": "text",
       "evening": "text",
       "activities": ["list", "of", "activities"],
       "meals": { "breakfast": "", "lunch": "", "dinner": "" },
       "transport": "text",
       "notes": "text"
     }
     ... continue for all ${daysNum} days
  ],
  "travel_tips": [".."],
  "local_cuisine": [".."]
}

Create realistic activities and approximate costs per day.
IMPORTANT: Use ${currency || 'USD'} for all cost estimates.
CRITICAL: The "daily" array MUST have EXACTLY ${daysNum} entries (day 1 through day ${daysNum}).
`;

    const result = await model.generateContent(intentPrompt);
    const raw = (await result.response).text();



    let parsedJson = null;
    try {
      parsedJson = JSON.parse(raw);
    } catch (err) {
      // If model returned text (not strict json), attempt to extract JSON substring
      const jsonMatch = raw.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[1]);
        } catch (e2) {
          parsedJson = null;
        }
      }
    }

    // Fallback: if parsing failed, save raw text into content and synthesize a simple JSON
    let aiJSON = parsedJson;
    if (!aiJSON) {
      aiJSON = {
        title: `${destination} ${duration}-day itinerary`,
        summary: raw.slice(0, 300),
        destination,
        duration: daysNum,
        daily: [
          { day: 1, title: 'Plan', morning: raw.slice(0, 200), afternoon: '', evening: '', activities: [], meals: {}, notes: '' }
        ],
        travel_tips: [],
        local_cuisine: []
      };
    }

    const record = {
      destination,
      duration: daysNum,
      budget: budget ? `${budget} ${currency || 'USD'}` : null,
      travelers: travelers || 1,
      interests: interests || [],
      accommodation_type: accommodation_type || null,
      ai_generated_content: typeof raw === 'string' ? raw : JSON.stringify(raw),
      ai_generated_json: aiJSON,
      client_id: client_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: req.user.id,
      agency_id: req.user.agency_id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('itineraries')
      .insert(record)
      .select()
      .single();

    if (error) throw error;

    // Increment Usage Count and Decrement Credits
    await supabase
      .from('agencies')
      .update({
        usage_count: agency.usage_count + 1,
        itinerary_credits: (agency.itinerary_credits || 0) - 1
      })
      .eq('id', req.user.agency_id);

    // Emit Automation Event
    emitEvent(EVENTS.ITINERARY.CREATED, {
      agency_id: req.user.agency_id,
      id: data.id,
      client_id: client_id || null,
      entityType: 'ITINERARY',
      message: `Itinerary generated for ${destination}`
    });

    return res.status(201).json({ success: true, itinerary: data });
  } catch (err) {
    console.error('Error generating itinerary:', err);
    return res.status(500).json({ error: 'Failed to generate itinerary', details: err.message });
  }
};

/**
 * Manual Create Itinerary (No AI generation, saves provided data)
 */
export const createItinerary = async (req, res) => {
  try {
    const {
      destination,
      duration,
      budget,
      currency,
      interests,
      travelers,
      accommodation_type,
      client_id,
      start_date,
      end_date,
      ai_generated_content,
      ai_generated_json,
      status
    } = req.body;

    const record = {
      destination,
      duration: duration || 1,
      budget: budget ? `${budget} ${currency || 'USD'}` : null,
      travelers: travelers || 1,
      interests: interests || [],
      accommodation_type: accommodation_type || null,
      ai_generated_content: ai_generated_content || '',
      ai_generated_json: ai_generated_json || {},
      client_id: client_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: req.user.id,
      agency_id: req.user.agency_id,
      status: status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Auto-Enrich Manual Plans (Anti-Gravity: Gaps Fill)
    // If travel_tips or local_cuisine are empty/missing, fetch from AI
    const jsonContent = record.ai_generated_json || {};
    if (destination && (!jsonContent.travel_tips?.length || !jsonContent.local_cuisine?.length)) {
      console.log(`[Itinerary] Enriching manual plan for ${destination}...`);
      try {
        const enriched = await enrichDestinationContent(destination);
        if (enriched) {
          record.ai_generated_json = {
            ...jsonContent,
            travel_tips: jsonContent.travel_tips?.length ? jsonContent.travel_tips : enriched.travel_tips,
            local_cuisine: jsonContent.local_cuisine?.length ? jsonContent.local_cuisine : enriched.local_cuisine
          };
        }
      } catch (enrichErr) {
        console.warn('[Itinerary] Gap fill failed:', enrichErr);
      }
    }

    const { data, error } = await supabase
      .from('itineraries')
      .insert(record)
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, itinerary: data });
  } catch (err) {
    console.error('Error creating itinerary:', err);
    return res.status(500).json({ error: 'Failed to create itinerary', details: err.message });
  }
};

/**
 * Get all itineraries (embedded client, created_by user profile)
 * Supports ?limit=5
 */
export const getItineraries = async (req, res) => {
  // console.log('getItineraries called for agency:', req.user.agency_id);
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    const clientId = req.query.clientId;

    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('agency_id', req.user.agency_id)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (limit) query = query.limit(limit);

    const { data: itineraries, error } = await query;
    if (error) throw error;

    if (!itineraries || itineraries.length === 0) {
      return res.json({ success: true, itineraries: [] });
    }

    // Manual join for clients
    const clientIds = [...new Set(itineraries.map(i => i.client_id).filter(Boolean))];
    const { data: clients } = await supabase
      .from('clients')
      .select('id, full_name, email, phone')
      .in('id', clientIds);

    const clientMap = (clients || []).reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});

    // Manual join for users
    const userIds = [...new Set(itineraries.map(i => i.created_by).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    const userMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    // Merge
    const enriched = itineraries.map(i => ({
      ...i,
      client: clientMap[i.client_id] || null,
      created_by_user: userMap[i.created_by] || null
    }));

    return res.json({ success: true, itineraries: enriched });
  } catch (err) {
    console.error('Error fetching itineraries:', err);
    return res.status(500).json({ error: 'Failed to fetch itineraries', details: err.message });
  }
};

/**
 * Get single itinerary by id
 */
export const getItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: itineraryData, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (error) throw error;
    if (!itineraryData) return res.status(404).json({ error: 'Itinerary not found' });

    // Parallel Fetch for Related Data (Manual Joins for Robustness)
    const [
      { data: user },
      { data: client },
      { data: bookings },
      { data: invoices },
      { data: invoiceItems }, // itinerary_items is actually on itineraries table directly? NO: itinerary_items table.
      { data: itineraryItems }
    ] = await Promise.all([
      // 1. Created By User
      itineraryData.created_by ? supabase.from('users').select('id, name, email').eq('id', itineraryData.created_by).single() : { data: null },

      // 2. Client
      itineraryData.client_id ? supabase.from('clients').select('*').eq('id', itineraryData.client_id).single() : { data: null },

      // 3. Bookings (Reverse relation)
      supabase.from('bookings').select('*, supplier:suppliers(name)').eq('itinerary_id', id),

      // 4. Invoices (Reverse relation)
      supabase.from('invoices').select('*').eq('itinerary_id', id),

      // 5. Invoice Items? No, wait. original query was invoices(*). invoices usually have items within them or filtered? 
      // Original query: invoices(*) -> just invoices table.
      // But wait. "invoice_items" table exists. 
      // The original query was invoices(*). 
      // I added invoiceItems in Promise.all just in case, but let's stick to original query scope.
      // 5. Placeholder
      { data: null },

      // 6. Itinerary Items (Reverse relation)
      supabase.from('itinerary_items').select('*').eq('itinerary_id', id)
    ]);

    const data = {
      ...itineraryData,
      created_by_user: user || null,
      client: client || null,
      bookings: bookings || [],
      invoices: invoices || [],
      itinerary_items: itineraryItems || []
    };

    console.log('[DEBUG] getItinerary Response Data:', JSON.stringify(data, null, 2));

    return res.json({ success: true, itinerary: data });
  } catch (err) {
    console.error('Error fetching itinerary:', err);
    return res.status(500).json({ error: 'Failed to fetch itinerary', details: err.message });
  }
};

/**
 * Update itinerary
 */
export const updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    // Filter updates to only include valid columns
    const allowedColumns = [
      'destination', 'duration', 'budget', 'travelers', 'interests',
      'accommodation_type', 'ai_generated_content', 'ai_generated_json',
      'client_id', 'start_date', 'end_date', 'status', 'updated_at'
    ];

    const validUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedColumns.includes(key)) {
        // Handle fields that might be empty strings but need to be null in the database
        if ((key === 'client_id' || key === 'start_date' || key === 'end_date') && updates[key] === '') {
          validUpdates[key] = null;
        } else {
          validUpdates[key] = updates[key];
        }
      }
    });

    validUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('itineraries')
      .update(validUpdates)
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, itinerary: data });
  } catch (err) {
    console.error('Error updating itinerary:', err);
    return res.status(500).json({ error: 'Failed to update itinerary', details: err.message });
  }
};

/**
 * Delete itinerary
 */
export const deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('agency_id', req.user.agency_id);

    if (error) throw error;
    return res.json({ success: true, message: 'Itinerary deleted' });
  } catch (err) {
    console.error('Error deleting itinerary:', err);
    return res.status(500).json({ error: 'Failed to delete itinerary', details: err.message });
  }
};

// ============================================
// ITINERARY ITEMS AUTOMATION & PRICING
// ============================================

export const createItineraryItem = async (req, res) => {
  try {
    const { id: itineraryId } = req.params;
    const itemData = req.body;

    // 1. Validate Pricing
    const pricingCheck = validatePricing(itemData);
    if (!pricingCheck.isValid) {
      return res.status(400).json({ error: 'Pricing Validation Failed', details: pricingCheck.errors });
    }

    // 2. Insert item
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({
        ...itemData,
        itinerary_id: itineraryId,
        agency_id: req.user.agency_id,
        final_price: pricingCheck.calculatedPrice, // Trusted backend calc
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    emitEvent(EVENTS.ITINERARY.PRICED, {
      agency_id: req.user.agency_id,
      id: itineraryId,
      entityType: 'ITINERARY',
      message: `Item added: ${itemData.title} ($${pricingCheck.calculatedPrice})`
    });

    res.status(201).json({ success: true, item: data });

  } catch (err) {
    console.error('Error creating itinerary item:', err);
    res.status(500).json({ error: 'Failed to create item', details: err.message });
  }
};

export const updateItineraryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    // If pricing fields are updated, validate again
    if (updates.cost_price !== undefined || updates.markup_value !== undefined) {
      // Need fetching original to merge? Or assume 'updates' has full context?
      // Better to assume Partial Update, but we need full data for validation.
      // fetch existing item:
      const { data: existing } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('id', itemId)
        .eq('agency_id', req.user.agency_id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Item not found' });

      const merged = { ...existing, ...updates };
      const pricingCheck = validatePricing(merged);

      if (!pricingCheck.isValid) {
        return res.status(400).json({ error: 'Pricing Validation Failed', details: pricingCheck.errors });
      }

      updates.final_price = pricingCheck.calculatedPrice;
    }

    const { data, error } = await supabase
      .from('itinerary_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('agency_id', req.user.agency_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, item: data });

  } catch (err) {
    console.error('Error updating itinerary item:', err);
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  }
};

export const deleteItineraryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)
      .eq('agency_id', req.user.agency_id);

    if (error) throw error;
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  }
};
