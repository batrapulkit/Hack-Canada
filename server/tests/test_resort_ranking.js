import { rankResorts } from '../src/services/resortService.js';

console.log("=== TEST: Resort Ranking Algorithm ===");

// MOCK DATA
const mockResorts = [
    { name: "Family Fun Resort", rating: 4.5, amenities: ["Pool", "Kids Club"], tags: ["Family"], price_level: 2 },
    { name: "Luxury Adult Only", rating: 4.8, amenities: ["Pool", "Spa", "Bar"], tags: ["Adult Only", "Luxury", "Honeymoon"], price_level: 4 },
    { name: "Budget Beach Shack", rating: 3.5, amenities: ["Wifi"], tags: ["Beach"], price_level: 1 }
];

// TEST 1: Family Trip (Budget Moderate)
console.log("\n[TEST 1] User wants: Family, Moderate Budget");
const criteria1 = { budget_level: 2, interests: ["Family"] };
const result1 = rankResorts(mockResorts, criteria1);

console.log("Top Pick:", result1[0].name, "| Score:", result1[0].score);
if (result1[0].name === "Family Fun Resort") console.log("✅ PASS");
else console.log("❌ FAIL");

// TEST 2: Honeymoon (Luxury)
console.log("\n[TEST 2] User wants: Honeymoon, Luxury");
const criteria2 = { budget_level: 4, interests: ["Honeymoon"] };
const result2 = rankResorts(mockResorts, criteria2);

console.log("Top Pick:", result2[0].name, "| Score:", result2[0].score);
if (result2[0].name === "Luxury Adult Only") console.log("✅ PASS");
else console.log("❌ FAIL");

// TEST 3: Cheap Trip
console.log("\n[TEST 3] User wants: Cheap");
const criteria3 = { budget_level: 1, interests: [] };
const result3 = rankResorts(mockResorts, criteria3);

console.log("Top Pick:", result3[0].name, "| Score:", result3[0].score);
// "Budget Beach Shack" (3.5*5 = 17.5 + 10 = 27.5) vs "Family Fun Resort" (4.5*5 + -10 = 12.5)
if (result3[0].name === "Budget Beach Shack") console.log("✅ PASS");
else console.log("❌ FAIL (Scoring check: " + JSON.stringify(result3.map(r => ({ n: r.name, s: r.score }))) + ")");
