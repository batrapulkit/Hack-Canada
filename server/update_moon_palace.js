import { supabase } from './src/config/supabase.js';

async function updateResortImage() {
    const imageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

    console.log("Searching for Moon Palace...");

    const { data: resorts, error: searchError } = await supabase
        .from('resorts')
        .select('id, name')
        .ilike('name', '%Moon Palace%');

    if (searchError) {
        console.error("Search Error:", searchError);
        process.exit(1);
    }

    if (!resorts || resorts.length === 0) {
        console.log("Moon Palace not found!");
        process.exit(1);
    }

    console.log(`Found ${resorts.length} resort(s). Updating...`);

    for (const resort of resorts) {
        console.log(`Updating ${resort.name} (${resort.id})...`);
        const { error: updateError } = await supabase
            .from('resorts')
            .update({ image_url: imageUrl })
            .eq('id', resort.id);

        if (updateError) {
            console.error(`Failed to update ${resort.name}:`, updateError);
        } else {
            console.log(`Successfully updated ${resort.name}`);
        }
    }
}

updateResortImage();
