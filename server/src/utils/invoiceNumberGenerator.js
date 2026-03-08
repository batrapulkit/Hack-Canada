import { supabase } from '../config/supabase.js';

/**
 * Generate next sequential invoice number for an agency
 * Format: PREFIX-YEAR-NNNNN (e.g., INV-2026-00001)
 * @param {string} agencyId - The agency ID
 * @returns {Promise<string>} The formatted invoice number
 */
export async function getNextInvoiceNumber(agencyId) {
    const currentYear = new Date().getFullYear();

    try {
        // Get agency invoice prefix (default to 'INV')
        const { data: agency } = await supabase
            .from('agencies')
            .select('invoice_prefix')
            .eq('id', agencyId)
            .single();

        const prefix = agency?.invoice_prefix || 'INV';

        // Try to get existing counter for this year
        let { data: counter } = await supabase
            .from('invoice_counters')
            .select('*')
            .eq('agency_id', agencyId)
            .eq('year', currentYear)
            .single();

        let nextNumber;

        if (counter) {
            // Increment existing counter
            nextNumber = counter.last_number + 1;

            const { error: updateError } = await supabase
                .from('invoice_counters')
                .update({
                    last_number: nextNumber,
                    updated_at: new Date().toISOString()
                })
                .eq('id', counter.id);

            if (updateError) throw updateError;
        } else {
            // Create new counter for this year
            nextNumber = 1;

            const { error: insertError } = await supabase
                .from('invoice_counters')
                .insert({
                    agency_id: agencyId,
                    year: currentYear,
                    last_number: nextNumber
                });

            if (insertError) {
                // Handle race condition - counter might have been created by another request
                const { data: existingCounter } = await supabase
                    .from('invoice_counters')
                    .select('*')
                    .eq('agency_id', agencyId)
                    .eq('year', currentYear)
                    .single();

                if (existingCounter) {
                    nextNumber = existingCounter.last_number + 1;
                    await supabase
                        .from('invoice_counters')
                        .update({
                            last_number: nextNumber,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingCounter.id);
                } else {
                    throw insertError;
                }
            }
        }

        // Format: PREFIX-YEAR-NNNNN (e.g., INV-2026-00001)
        const formattedNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
        return formattedNumber;

    } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to timestamp-based number if sequential fails
        return `INV-${currentYear}-${Date.now()}`;
    }
}
