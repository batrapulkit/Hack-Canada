import { supabase } from './src/config/supabase.js';

async function fixMissingPackages() {
    console.log("Checking for resorts with no packages...");

    // 1. Get all resorts
    const { data: resorts, error } = await supabase
        .from('resorts')
        .select('id, name, price_level, rating');

    if (error) {
        console.error("Error fetching resorts:", error);
        return;
    }

    console.log(`Found ${resorts.length} total resorts.`);

    let fixedCount = 0;

    for (const resort of resorts) {
        // 2. Check if package exists
        const { count, error: countError } = await supabase
            .from('packages')
            .select('*', { count: 'exact', head: true })
            .eq('resort_id', resort.id);

        if (countError) {
            console.error(`Error checking packages for ${resort.name}:`, countError);
            continue;
        }

        if (count === 0) {
            console.log(`Resort "${resort.name}" has 0 packages. Creating default...`);

            // Heuristic Price: $150 per star or $200 * price_level
            // fallback to $300 if missing info
            const basePrice = (resort.price_level || 3) * 150;

            const defaultPackage = {
                resort_id: resort.id,
                name: "Standard Best Rate",
                description: "Flexible rate for a standard room. Includes access to all resort amenities.",
                price: basePrice,
                currency: 'USD',
                duration_days: 5, // Default duration for the 'Package' view
                inclusions: ["Accommodation", "WiFi", "Fitness Center Access", "Concierge Service"],
                image_url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80" // Generic bedroom
            };

            const { error: insertError } = await supabase
                .from('packages')
                .insert(defaultPackage);

            if (insertError) {
                console.error(`Failed to create package for ${resort.name}:`, insertError);
            } else {
                console.log(`✅ Created default package for ${resort.name}`);
                fixedCount++;
            }
        }
    }

    console.log(`\nFinished! Fixed ${fixedCount} resorts.`);
}

fixMissingPackages();
