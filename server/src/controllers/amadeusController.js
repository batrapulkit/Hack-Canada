import AmadeusEnterpriseService from '../services/amadeusEnterpriseService.js';
import { supabase } from '../config/supabase.js';

// Helper to get Service Instance dynamically based on Agency ID
async function getAmadeusService(agencyId) {
    if (agencyId) {
        const { data: config } = await supabase
            .from('agency_gds_config')
            .select('*')
            .eq('agency_id', agencyId)
            .single();

        if (config && config.amadeus_client_id && config.amadeus_client_secret) {
            return new AmadeusEnterpriseService({
                amadeus_client_id: config.amadeus_client_id,
                amadeus_client_secret: config.amadeus_client_secret,
                amadeus_url: config.amadeus_environment === 'production'
                    ? 'https://api.amadeus.com'
                    : 'https://test.api.amadeus.com'
            });
        }
    }

    // Fallback to System Env (if any)
    return new AmadeusEnterpriseService({
        amadeus_client_id: process.env.AMADEUS_API_KEY,
        amadeus_client_secret: process.env.AMADEUS_SECRET,
        amadeus_url: process.env.AMADEUS_URL || 'https://test.api.amadeus.com'
    });
}

export const searchFlights = async (req, res) => {
    try {
        const { from, to, departDate, returnDate, passengers, class: cabinClass } = req.body;

        // Get Agency Level Service
        // req.user is populated by authenticate middleware
        const agencyId = req.user?.agency_id || req.query.agency_id;
        const amadeusService = await getAmadeusService(agencyId);

        if (!from || !to || !departDate) {
            return res.status(400).json({ error: 'Missing required parameters: from, to, departDate' });
        }

        // Map frontend params to Amadeus Keys
        const searchParams = {
            originLocationCode: from,
            destinationLocationCode: to,
            departureDate: departDate,
            returnDate: returnDate || undefined, // Optional
            adults: passengers || 1,
            currencyCode: 'USD', // Default to USD for consistency
            max: 20 // Limit results
        };

        const results = await amadeusService.searchFlights(searchParams);

        // Transform results to frontend friendly format (lightweight)
        const simplifiedResults = results.map((offer, index) => {
            const itinerary = offer.itineraries[0];
            const firstSeg = itinerary.segments[0];
            const lastSeg = itinerary.segments[itinerary.segments.length - 1];

            // Extract airline and flight info
            const carrierCode = offer.validatingAirlineCodes[0];
            const flightNumber = `${firstSeg.carrierCode}${firstSeg.number}`;
            // Basic cabin from first segment of first traveler
            const cabinClass = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';

            return {
                id: offer.id,
                airline: carrierCode,
                flightNumber: flightNumber,
                from: firstSeg.departure.iataCode,
                to: lastSeg.arrival.iataCode,
                departTime: firstSeg.departure.at.split('T')[1].substring(0, 5),
                arriveTime: lastSeg.arrival.at.split('T')[1].substring(0, 5),
                duration: itinerary.duration.replace('PT', '').toLowerCase(),
                stops: itinerary.segments.length - 1,
                price: parseFloat(offer.price.total),
                currency: offer.price.currency,
                class: cabinClass,
                // Critical: Pass sufficient metadata for "Planned" booking creation
                _raw: {
                    carrierCode,
                    flightNumber,
                    departure: firstSeg.departure,
                    arrival: lastSeg.arrival,
                    segments: itinerary.segments,
                    price: offer.price, // contains currency
                    travelerPricings: offer.travelerPricings
                }
            };
        });

        res.json(simplifiedResults);

    } catch (error) {
        console.error('Amadeus Search Error:', error);

        // Return structured error for UI Guardrails
        const status = error.response?.status || 500;
        const code = error.code || 'UNKNOWN_ERROR';

        res.status(status).json({
            error: 'Flight search unavailable',
            code: 'SEARCH_UNAVAILABLE',
            details: error.message
        });
    }
};
