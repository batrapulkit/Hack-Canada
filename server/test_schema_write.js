import { supabase } from './src/config/supabase.js';

async function testSchema() {
    console.log("Testing write to 'external_id' column...");

    // Attempt insert
    const { data, error } = await supabase.from('resorts').insert({
        name: "Schema Test Resort",
        location: "Test City",
        country: "TC",
        external_id: "TEST_ID_123"
    }).select().single();

    if (error) {
        console.error("❌ Write Failed:", error.message);
        console.error("Details:", error);
    } else {
        console.log("✅ Write Checked Pass: Resort ID", data.id);
        console.log("Saved External ID:", data.external_id);

        // Cleanup
        await supabase.from('resorts').delete().eq('id', data.id);
        console.log("Cleanup complete.");
    }
}

testSchema();
