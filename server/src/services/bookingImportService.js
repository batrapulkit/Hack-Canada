
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { convertFlightToItinerary } from './flightAutomation.js';
dotenv.config();

// Use Service Role Key for backend operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const importBookingData = async (agency_id, bookingData, pnr) => {
    try {
        // Validate input
        if (!agency_id) throw new Error('Agency ID is required');
        if (!bookingData) throw new Error('Booking data is required');
        if (!pnr) throw new Error('PNR reference is required');

        // 1. Transform Data
        const travelers = bookingData.travelers || [];
        const flightOffers = bookingData.flightOffers || [];

        let primaryClient = null;
        const amadeusId = bookingData.id;
        let resultBooking;
        let action = 'created';

        // 2. Handle Travelers (Clients)
        for (const traveler of travelers) {
            const name = traveler.name;
            const firstName = name.firstName;
            const lastName = name.lastName;
            const dateOfBirth = traveler.dateOfBirth;
            const contact = traveler.contact || {};
            const email = contact.emailAddress;
            const phone = contact.phones?.[0]?.number;

            let clientData = null;

            if (email) {
                const { data: existing } = await supabase.from('clients')
                    .select('*')
                    .eq('agency_id', agency_id)
                    .eq('email', email)
                    .single();
                clientData = existing;
            }

            if (!clientData) {
                const { data: newClient, error: createError } = await supabase.from('clients').insert({
                    agency_id,
                    full_name: `${firstName} ${lastName}`,
                    email: email || null,
                    phone: phone || null,
                    date_of_birth: dateOfBirth || null,
                    notes: `Imported from Amadeus PNR ${pnr}`
                }).select().single();

                if (createError) throw createError;
                clientData = newClient;
            }

            if (!primaryClient) primaryClient = clientData;
        }

        // 3. Handle Flights (Bookings)
        // Check if we already have this booking (by Amadeus ID OR PNR Reference)
        let existingBooking = null;

        if (amadeusId) {
            const { data: byAmadeusId } = await supabase.from('bookings')
                .select('*')
                .eq('agency_id', agency_id)
                .eq('amadeus_booking_id', amadeusId)
                .maybeSingle();
            existingBooking = byAmadeusId;
        }

        // Also check by PNR if not found by Amadeus ID
        if (!existingBooking && pnr) {
            const { data: byPnr } = await supabase.from('bookings')
                .select('*')
                .eq('agency_id', agency_id)
                .eq('pnr_reference', pnr)
                .maybeSingle();
            existingBooking = byPnr;
        }

        const firstItin = flightOffers[0]?.itineraries?.[0];
        const firstSegment = firstItin?.segments?.[0];
        const description = firstSegment
            ? `Flight ${firstSegment.carrierCode}${firstSegment.number} ${firstSegment.departure.iataCode}-${firstSegment.arrival.iataCode}`
            : `Amadeus Booking ${pnr}`;

        const price = flightOffers[0]?.price?.grandTotal || 0;

        const bookingPayload = {
            agency_id,
            client_id: primaryClient?.id,
            booking_type: 'Flight',
            booking_status: 'confirmed',
            confirmation_number: pnr,
            amadeus_booking_id: amadeusId,
            pnr_reference: pnr,
            description,
            cost: price,
            sell_price: price, // In reality, add markup
            last_synced_at: new Date(),
            raw_gds_data: bookingData,
            travel_date: firstSegment?.departure?.at || new Date()
        };

        if (existingBooking) {
            action = 'updated';
            const { data: updated, error: updateError } = await supabase.from('bookings')
                .update(bookingPayload)
                .eq('id', existingBooking.id)
                .select()
                .single();
            if (updateError) throw updateError;
            resultBooking = updated;
        } else {
            const { data: inserted, error: insertError } = await supabase.from('bookings')
                .insert(bookingPayload)
                .select()
                .single();
            if (insertError) throw insertError;
            resultBooking = inserted;
        }

        // 4. Auto-Create Itinerary (Anti-Gravity)
        // If this is a new booking or we want to sync, let's create a draft itinerary if one doesn't exist
        if (resultBooking) {
            // Check for existing itinerary by PNR reference in title or something?
            // Or just check if client has an active draft.
            // For now, let's create a specific "Imported Itinerary"

            try {
                const itinData = convertFlightToItinerary(bookingData);
                if (itinData) {
                    // Check if we already imported this PNR into an itinerary
                    const { data: existingItin } = await supabase.from('itineraries')
                        .select('id')
                        .eq('agency_id', agency_id)
                        .ilike('ai_generated_content', `%PNR: ${pnr}%`)
                        .single();

                    if (!existingItin) {
                        console.log(`[BookingImport] Auto-generating Itinerary for PNR ${pnr}`);
                        const { error: itinError } = await supabase.from('itineraries').insert({
                            agency_id,
                            client_id: primaryClient?.id,
                            destination: itinData.detailedPlan.destination,
                            duration: itinData.detailedPlan.dailyPlan.length,
                            ai_generated_json: itinData,
                            ai_generated_content: `Auto-generated from PNR: ${pnr}`,
                            status: 'draft',
                            created_by: null, // System
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                        if (itinError) console.error("Failed to auto-create itinerary:", itinError);
                    }
                }
            } catch (e) {
                console.error("Flight-to-Itinerary failed:", e);
            }
        }

        console.log(`[BookingImport] Successfully ${action} booking ${pnr}`);
        return { client: primaryClient, booking: resultBooking, action };

    } catch (error) {
        console.error(`[BookingImport] Failed to import PNR ${pnr}:`, error);
        throw new Error(`Failed to import booking: ${error.message}`);
    }
};
