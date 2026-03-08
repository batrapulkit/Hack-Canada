import { convertFlightToItinerary } from '../src/services/flightAutomation.js';

console.log("=== TEST: Flight Automation ===");

const mockPnr = {
    id: "XYZ123",
    flightOffers: [{
        price: { currency: "USD", total: "1500.00" },
        itineraries: [
            {
                segments: [
                    {
                        departure: { at: "2026-05-01T10:00:00", iataCode: "JFK" },
                        arrival: { at: "2026-05-01T14:30:00", iataCode: "CUN" },
                        carrierCode: "AA",
                        number: "100",
                        duration: "PT4H30M"
                    }
                ]
            },
            {
                segments: [
                    {
                        departure: { at: "2026-05-08T18:00:00", iataCode: "CUN" },
                        arrival: { at: "2026-05-08T22:30:00", iataCode: "JFK" },
                        carrierCode: "AA",
                        number: "101",
                        duration: "PT4H30M"
                    }
                ]
            }
        ]
    }]
};

const result = convertFlightToItinerary(mockPnr);

console.log("\nGenerated Itinerary Plan:");
console.log(JSON.stringify(result, null, 2));

if (result.detailedPlan.destination === "CUN") console.log("✅ Destination Correct");
else console.log("❌ Destination Failed");

if (result.detailedPlan.dailyPlan.length === 2) console.log("✅ 2 Flight Days Found");
else console.log("❌ Daily Plan Length Mismatch");

if (result.detailedPlan.dailyPlan[1].title.includes("Return")) console.log("✅ Return Flight Detected");
else console.log("❌ Return Flight Title Mismatch");
