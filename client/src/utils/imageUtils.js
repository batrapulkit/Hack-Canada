export const getDayImageUrl = (text, dayIndex, itineraryId = '') => {
    const t = text?.toLowerCase() || '';

    // Map of keywords to ARRAYS of high-quality images
    // This supports multiple images for the same destination/activity
    const KEYWORD_IMAGES = {
        // Destinations - Dubai
        'dubai': [
            'https://images.unsplash.com/photo-1512453979798-5ea90418c5d9?q=80&w=800', // Marina
            'https://images.unsplash.com/photo-1578895101408-1a36b8342f0d?q=80&w=800', // Burj Khalifa night
            'https://images.unsplash.com/photo-1565099824688-e93dc20633d6?q=80&w=800', // Desert
            'https://images.unsplash.com/photo-1546412414-8035e1776c9a?q=80&w=800', // Atlantis
        ],
        'paris': [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800', // Eiffel
            'https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=800', // Louvre
            'https://images.unsplash.com/photo-1511739001486-6bfe10ce7859?q=80&w=800', // Street
        ],
        'london': [
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800', // Big Ben
            'https://images.unsplash.com/photo-1533929736458-ca588d080e81?q=80&w=800', // Tower Bridge
        ],
        'rome': [
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800', // Colosseum
            'https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=800', // Trevi
        ],
        'tokyo': [
            'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800', // Tokyo Tower
            'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=800', // Shibuya
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800', // Neon Street
            'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=800', // Shibuya Crossing
        ],
        'japan': [
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800', // Kyoto street
            'https://images.unsplash.com/photo-1528360983277-13d9012356ee?q=80&w=800', // Torii Gate
        ],
        'new york': [
            'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800', // Skyline
            'https://images.unsplash.com/photo-1485871981535-6100a441b43a?q=80&w=800', // Time Square
        ],
        'bali': [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800',
            'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=800',
        ],
        'maldives': [
            'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=800'
        ],

        // Themes
        'beach': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=800'],
        'mountain': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800', 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=800'],
        'city': ['https://images.unsplash.com/photo-1449824913929-2b3d35a9013d?q=80&w=800', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800'],
        'food': ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800'],
        'shopping': ['https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800'],
        'museum': ['https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800', 'https://images.unsplash.com/photo-1544413164-9cf94e9d6d4a?q=80&w=800'],
        'art': ['https://images.unsplash.com/photo-1518998053901-5348d3969104?q=80&w=800', 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=800'],
        'temple': ['https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=800'],
    };

    // Check for specific keywords
    let keywordMatches = [];
    for (const [key, urls] of Object.entries(KEYWORD_IMAGES)) {
        if (t.includes(key)) {
            // Found a match (e.g. 'tokyo'), store the possible images
            // We use Array.isArray because I might not have converted ALL keys to arrays yet (though above I did mostly)
            if (Array.isArray(urls)) {
                keywordMatches = urls;
            } else {
                keywordMatches = [urls];
            }
            break; // Stop at first strong match
        }
    }

    if (keywordMatches.length > 0) {
        // We found a relevant keyword pool (e.g. 4 Tokyo images)
        // Deterministically pick one based on dayIndex so Day 1 gets Image A, Day 2 gets Image B
        // We also mix in itineraryId so Trip X and Trip Y differ slightly if possible, 
        // but prioritized ensuring Day 1 != Day 2
        return keywordMatches[dayIndex % keywordMatches.length];
    }

    // --- FALLBACK LOGIC ---

    const FALLBACK_IMAGES = [
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800", // Roadtrip
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800", // Mountains/Lake
        "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800", // Hike
        "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=800", // Landscape
        "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=800", // Mountain abstract
        "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=800", // Plane wing
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800", // Water/rocks
        "https://images.unsplash.com/photo-1465778890750-60237ce85bf4?q=80&w=800", // Flower/nature
        "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=800", // Abstract nature
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800", // Coffee shop
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800", // Forest
        "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=800", // Bridge/nature
        "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=800", // Mountains snowy
        "https://images.unsplash.com/photo-1439853949127-fa8494148b36?q=80&w=800", // Landscape
        "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=800", // Beach birds
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800", // Foggy forest
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800", // Sunlight forest
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800", // Tree
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800", // Snowy
        "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800", // Morning light
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=800", // Alpine
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800", // Starry sky
        "https://images.unsplash.com/photo-1426604966848-d3ad1e457ce6?q=80&w=800", // Grand canyon like
        "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=800", // Bridge
        "https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=800", // Tropical
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800", // City street
        "https://images.unsplash.com/photo-1555217851-6141535bd771?q=80&w=800", // Dinner table
        "https://images.unsplash.com/photo-1523309996740-d5315f9cc28b?q=80&w=800", // Food plate
        "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?q=80&w=800", // Shoes/travel
    ];

    // Deterministic selection based on text + itineraryId only
    const combinedKey = (t + itineraryId).toLowerCase();
    const charSum = combinedKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Mix in dayIndex strongly to ensure Day 1 != Day 2 even if text is similar
    const index = (charSum + (dayIndex * 13)) % FALLBACK_IMAGES.length;

    return FALLBACK_IMAGES[index];
};
