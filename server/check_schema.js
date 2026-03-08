import { supabase } from './src/config/supabase.js';

async function checkSchema() {
    console.log("Checking agencies table schema...");

    // We can't easily DESCRIBE table via supabase-js client directly without SQL function usually,
    // but we can try to insert/select a dummy to see if it errors, or inspect an existing row.

    try {
        const { data, error } = await supabase
            .from('agencies')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error fetching agency:", error);
            return;
        }

        if (data && data.length > 0) {
            const row = data[0];
            console.log("Found agency row. Checking keys:");
            const expected = ['address_line1', 'phone', 'tico_registration_number', 'invoice_settings'];
            const found = [];
            const missing = [];

            expected.forEach(key => {
                if (key in row) {
                    found.push(key);
                } else {
                    missing.push(key);
                }
            });

            console.log("✅ Found columns:", found.join(', '));
            if (missing.length > 0) {
                console.error("❌ MISSING columns:", missing.join(', '));
            } else {
                console.log("✅ All Compliance columns appear to be present in the returned object.");
            }

            console.log("Sample Invoice Settings:", JSON.stringify(row.invoice_settings, null, 2));

        } else {
            console.log("No agencies found to check.");
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

checkSchema();
