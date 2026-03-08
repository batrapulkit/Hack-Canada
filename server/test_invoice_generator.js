// Test the invoice number generator directly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Copy of the getNextInvoiceNumber function
async function getNextInvoiceNumber(agencyId) {
    const currentYear = new Date().getFullYear();

    try {
        console.log(`\n🔍 Generating invoice number for agency: ${agencyId}`);
        console.log(`   Year: ${currentYear}`);

        // Get agency invoice prefix (default to 'INV')
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('invoice_prefix')
            .eq('id', agencyId)
            .single();

        if (agencyError) {
            console.error('   ❌ Error fetching agency:', agencyError.message);
        } else {
            console.log(`   ✅ Agency prefix: ${agency?.invoice_prefix || 'INV (default)'}`);
        }

        const prefix = agency?.invoice_prefix || 'INV';

        // Try to get existing counter for this year
        console.log(`\n   Querying invoice_counters table...`);
        let { data: counter, error: counterError } = await supabase
            .from('invoice_counters')
            .select('*')
            .eq('agency_id', agencyId)
            .eq('year', currentYear)
            .single();

        if (counterError) {
            console.error(`   ❌ Counter query error: ${counterError.message}`);
            console.error(`      Code: ${counterError.code}`);
        } else if (counter) {
            console.log(`   ✅ Found existing counter:`, counter);
        } else {
            console.log(`   ℹ️  No counter found for ${currentYear}`);
        }

        let nextNumber;

        if (counter) {
            // Increment existing counter
            nextNumber = counter.last_number + 1;
            console.log(`\n   📝 Incrementing counter to: ${nextNumber}`);

            const { error: updateError } = await supabase
                .from('invoice_counters')
                .update({
                    last_number: nextNumber,
                    updated_at: new Date().toISOString()
                })
                .eq('id', counter.id);

            if (updateError) {
                console.error(`   ❌ Update error: ${updateError.message}`);
                throw updateError;
            } else {
                console.log(`   ✅ Counter updated successfully`);
            }
        } else {
            // Create new counter for this year
            nextNumber = 1;
            console.log(`\n   ➕ Creating new counter starting at: ${nextNumber}`);

            const { error: insertError } = await supabase
                .from('invoice_counters')
                .insert({
                    agency_id: agencyId,
                    year: currentYear,
                    last_number: nextNumber
                });

            if (insertError) {
                console.error(`   ❌ Insert error: ${insertError.message}`);
                console.error(`      Code: ${insertError.code}`);

                // Handle race condition - counter might have been created by another request
                const { data: existingCounter } = await supabase
                    .from('invoice_counters')
                    .select('*')
                    .eq('agency_id', agencyId)
                    .eq('year', currentYear)
                    .single();

                if (existingCounter) {
                    console.log(`   ℹ️  Race condition - counter was created by another request`);
                    nextNumber = existingCounter.last_number + 1;
                    await supabase
                        .from('invoice_counters')
                        .update({
                            last_number: nextNumber,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingCounter.id);
                    console.log(`   ✅  Updated existing counter to: ${nextNumber}`);
                } else {
                    throw insertError;
                }
            } else {
                console.log(`   ✅ Counter created successfully`);
            }
        }

        // Format: PREFIX-YEAR-NNNNN (e.g., INV-2026-00001)
        const formattedNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
        console.log(`\n✅ Generated Invoice Number: ${formattedNumber}\n`);
        return formattedNumber;

    } catch (error) {
        console.error('\n❌ Error generating invoice number:', error.message);
        console.error('   Falling back to timestamp-based number\n');
        // Fallback to timestamp-based number if sequential fails
        return `INV-${currentYear}-${Date.now()}`;
    }
}

// Test the function
async function test() {
    // Get the first agency
    const { data: agencies } = await supabase
        .from('agencies')
        .select('id, agency_name')
        .limit(1);

    if (!agencies || agencies.length === 0) {
        console.error('No agencies found!');
        return;
    }

    const agency = agencies[0];
    console.log(`Testing with agency: ${agency.agency_name} (${agency.id})`);

    // Generate 3 invoice numbers
    for (let i = 1; i <= 3; i++) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Test ${i}:`);
        console.log('='.repeat(60));
        const invoiceNumber = await getNextInvoiceNumber(agency.id);
    }
}

test();
