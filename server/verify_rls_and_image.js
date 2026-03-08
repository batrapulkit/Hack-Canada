
import { supabase } from './src/config/supabase.js';

async function verify() {
    console.log("1. Fixing Broken Image for Moon Palace...");
    const { data: resorts, error: rError } = await supabase
        .from('resorts')
        .select('id, name, image_url')
        .ilike('name', '%Moon Palace%');

    if (resorts && resorts.length > 0) {
        for (const r of resorts) {
            if (!r.image_url || !r.image_url.startsWith('http')) {
                console.log(`Fixing image for ${r.name}`);
                await supabase.from('resorts').update({
                    image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80'
                }).eq('id', r.id);
            }
        }
    }

    console.log("2. Testing Itinerary Insert (Server-Side)...");

    // We need a valid user and agency to test foreign keys.
    const { data: users } = await supabase.from('users').select('id, agency_id').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to test with.");
        return;
    }
    const testUser = users[0];
    console.log(`Testing with User: ${testUser.id}, Agency: ${testUser.agency_id}`);

    const payload = {
        destination: "Test Destination",
        duration: 5,
        travelers: 2,
        budget: 'luxury',
        status: 'draft',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        ai_generated_json: { test: true },
        created_by: testUser.id,
        agency_id: testUser.agency_id
    };

    const { data: itin, error: iError } = await supabase
        .from('itineraries')
        .insert(payload)
        .select()
        .single();

    if (iError) {
        console.error("Insert Failed (Server Side):", iError);
    } else {
        console.log("Insert Success (Server Side):", itin.id);
        // Cleanup
        await supabase.from('itineraries').delete().eq('id', itin.id);
    }
}

verify();
