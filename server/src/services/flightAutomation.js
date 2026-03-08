/**
 * Flight Automation Service
 * Converts raw GDS Flight Segments into structured Itinerary Items
 */

export function convertFlightToItinerary(pnrData) {
    if (!pnrData || !pnrData.flightOffers || pnrData.flightOffers.length === 0) {
        return null; // No flights
    }

    const offer = pnrData.flightOffers[0];
    const itineraries = offer.itineraries || [];

    // We want to generate a "Daily Plan" structure compatible with our AI JSON
    // { "day": 1, "title": "Flight to X", ... }

    const dailyPlans = [];

    itineraries.forEach((itin, index) => {
        const segments = itin.segments;
        if (!segments || segments.length === 0) return;

        // First segment determines departure date
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];

        const departureDate = new Date(firstSeg.departure.at);
        const arrivalDate = new Date(lastSeg.arrival.at);

        // Calculate Duration
        const durationStr = firstSeg.duration; // PT2H30M

        // Build Title
        const isReturn = index > 0; // Rough heuristic, assuming 1st is outbound
        const title = isReturn
            ? `Return Flight: ${firstSeg.departure.iataCode} to ${lastSeg.arrival.iataCode}`
            : `Travel Day: Fly to ${lastSeg.arrival.iataCode}`;

        // Build Description
        const desc = segments.map(s =>
            `Flight ${s.carrierCode}${s.number} (${s.departure.iataCode} -> ${s.arrival.iataCode})`
        ).join(', ');

        // Construct Daily Item
        dailyPlans.push({
            day: index + 1, // This is relative, might need actual dates
            date: departureDate.toISOString().split('T')[0],
            title: title,
            description: `Departing at ${firstSeg.departure.at.split('T')[1].substring(0, 5)}. ${desc}. Arriving at ${lastSeg.arrival.at.split('T')[1].substring(0, 5)}.`,
            transport: `Flight (${offer.price.currency} ${offer.price.total})`,
            activities: ["Airport Transfer", "Check-in"],
            flight_details: {
                pnr: pnrData.id,
                carrier: firstSeg.carrierCode,
                number: firstSeg.number,
                departure: firstSeg.departure.at,
                arrival: lastSeg.arrival.at
            }
        });
    });

    return {
        // Return partial itinerary structure
        detailedPlan: {
            destination: itineraries[0]?.segments[itineraries[0].segments.length - 1].arrival.iataCode || "Unknown",
            dailyPlan: dailyPlans,
            flights: {
                price: `${offer.price.currency} ${offer.price.total}`,
                airline: offer.validatingAirlineCodes?.[0] || "Multiple"
            }
        }
    };
}
