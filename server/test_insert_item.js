
import { supabase } from './src/config/supabase.js';

async function testInsert() {
    console.log("Starting Day Field Test...");

    try {
        const { data: itineraries } = await supabase.from('itineraries').select('id, agency_id, created_by').limit(1);
        if (!itineraries || itineraries.length === 0) return console.log("No itinerary found");
        const itinerary = itineraries[0];

        // Payload with DAY and CREATED_BY
        const itemAttempt = {
            itinerary_id: itinerary.id,
            agency_id: itinerary.agency_id,
            created_by: itinerary.created_by,
            day: 1, // HYPOTHESIS: This is required
            title: 'Test Item with Day',
            cost_price: 100,
            markup_type: 'percentage',
            markup_value: 10,
            final_price: 110,
            activity_type: 'other',
            currency: 'USD',
            created_at: new Date().toISOString()
        };

        console.log("Attempting Insert with day...", itemAttempt);
        const { data, error } = await supabase.from('itinerary_items').insert(itemAttempt).select();

        if (error) {
            console.error("❌ Failed:", error.message);
        } else {
            console.log("✅ Success:", data);
            await supabase.from('itinerary_items').delete().eq('id', data[0].id);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testInsert();
