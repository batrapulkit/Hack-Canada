import { supabase } from './src/config/supabase.js';

const resorts = [
    {
        name: "Grand Velas Riviera Maya",
        location: "Playa del Carmen, Mexico",
        country: "Mexico",
        description: "Experience the epitome of luxury at Grand Velas Riviera Maya. This all-inclusive resort offers world-class dining, a holistic spa, and breathtaking ocean views. Perfect for families and couples alike.",
        amenities: ["Spa", "Beachfront", "Kids Club", "Fine Dining", "Gym", "All-Inclusive"],
        tags: ["luxury", "family", "beach", "spa", "honeymoon"],
        price_level: 5,
        rating: 4.9,
        image_url: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/253906473.jpg?k=ac402f0d92209633391745432924536758509312217621182283188562382928&o=&hp=1",
        sentiment_score: 0.98
    },
    {
        name: "Hotel Xcaret Arte",
        location: "Playa del Carmen, Mexico",
        country: "Mexico",
        description: "An homage to Mexican art, Hotel Xcaret Arte is an adults-only experience featuring eco-integrating architecture, artistic workshops, and unlimited access to Xcaret parks.",
        amenities: ["Adults Only", "Eco-Friendly", "Art Workshops", "All-Parks Access", "Rooftop Pool"],
        tags: ["adults-only", "art", "eco", "adventure", "culture"],
        price_level: 4,
        rating: 4.8,
        image_url: "https://www.hotelxcaret.com/assets/img/concept/xcaret-arte-hotel-all-inclusive-adults-only-playa-del-carmen.jpg",
        sentiment_score: 0.95
    },
    {
        name: "Le Blanc Spa Resort",
        location: "Cancun, Mexico",
        country: "Mexico",
        description: "The ultimate adults-only all-inclusive sanctuary. Le Blanc Spa Resort Cancun offers butler service, gourmet cuisine, and a state-of-the-art spa for complete relaxation.",
        amenities: ["Adults Only", "Butler Service", "Spa", "Infinity Pool", "Fine Dining"],
        tags: ["luxury", "adults-only", "romance", "spa", "cancun"],
        price_level: 5,
        rating: 4.9,
        image_url: "https://leblancsparesorts.com/sites/default/files/2021-02/cancun-overview-hero.jpg",
        sentiment_score: 0.97
    }
];

async function seed() {
    console.log("Seeding Resorts...");

    // Insert Resorts
    const { data: insertedResorts, error: rError } = await supabase
        .from('resorts')
        .insert(resorts)
        .select();

    if (rError) {
        console.error("Resort Seed Error:", rError);
        return;
    }

    console.log(`Inserted ${insertedResorts.length} resorts.`);

    // Insert Packages for the first resort (Grand Velas)
    const gv = insertedResorts.find(r => r.name.includes("Velas"));
    if (gv) {
        const pkg1 = {
            resort_id: gv.id,
            name: "Honeymoon Bliss",
            description: "Romantic dinner on the beach, couple's massage, and suite upgrade.",
            price: 5200,
            duration_days: 5,
            inclusions: ["Private Transfer", "Spa Credit", "Romantic Dinner"],
            valid_from: new Date(),
            valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            image_url: gv.image_url
        };
        const pkg2 = {
            resort_id: gv.id,
            name: "Family Fun Week",
            description: "Kids stay free! Includes access to kids club and family photo session.",
            price: 6500,
            duration_days: 7,
            inclusions: ["Kids Club", "Family Portrait", "All Meals"],
            valid_from: new Date(),
            valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            image_url: gv.image_url
        };
        await supabase.from('packages').insert([pkg1, pkg2]);
        console.log("Added GV Packages.");
    }

    // Insert Packages for Xcaret
    const xc = insertedResorts.find(r => r.name.includes("Xcaret"));
    if (xc) {
        const pkg = {
            resort_id: xc.id,
            name: "Art & Adventure",
            description: "Includes unlimited access to all Xcaret parks and specific art workshops.",
            price: 4200,
            duration_days: 5,
            inclusions: ["Park Access", "Workshops", "Transfer"],
            valid_from: new Date(),
            valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            image_url: xc.image_url
        };
        await supabase.from('packages').insert([pkg]);
        console.log("Added Xcaret Packages.");
    }

    console.log("Seeding Complete!");
}

seed();
