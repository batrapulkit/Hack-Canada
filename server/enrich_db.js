
import { supabase } from './src/config/supabase.js';
import { getModel } from './src/config/gemini.js';

async function enrichResorts() {
    console.log("Starting Auto-Enrichment...");

    // 1. Get resorts that need enriching (missing amenities or no packages)
    const { data: resorts, error } = await supabase
        .from('resorts')
        .select('id, name, location, amenities, packages(id)')
        .limit(20); // Limit batch size

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    const model = getModel();

    for (const resort of resorts) {
        let needsUpdate = false;
        let newAmenities = resort.amenities;

        // Check Amenities
        if (!resort.amenities || resort.amenities.length < 3) {
            console.log(`Enriching Amenities for: ${resort.name}`);
            const prompt = `Generate 10 realistic luxury resort amenities for "${resort.name}" in "${resort.location}". Return as JSON array of strings only.`;
            try {
                const res = await model.generateContent(prompt);
                const txt = res.response.text();
                const json = JSON.parse(txt.replace(/```json/g, '').replace(/```/g, '').trim());
                if (Array.isArray(json)) {
                    newAmenities = json;
                    needsUpdate = true;
                }
            } catch (e) {
                console.warn("Amenities Gen failed", e);
            }
        }

        // Update Resort if needed
        if (needsUpdate) {
            await supabase
                .from('resorts')
                .update({ amenities: newAmenities })
                .eq('id', resort.id);
            console.log(`Updated amenities for ${resort.name}`);
        }

        // Check Packages
        if (!resort.packages || resort.packages.length === 0) {
            console.log(`Creating Packages for: ${resort.name}`);
            const prompt = `Create 3 realistic travel packages for "${resort.name}". 
            Return JSON: [ { "name": "string", "description": "string", "price": number, "duration_days": number, "inclusions": ["string"] } ]`;

            try {
                const res = await model.generateContent(prompt);
                const txt = res.response.text();
                const packages = JSON.parse(txt.replace(/```json/g, '').replace(/```/g, '').trim());

                if (Array.isArray(packages)) {
                    for (const pkg of packages) {
                        await supabase
                            .from('packages')
                            .insert({
                                resort_id: resort.id,
                                name: pkg.name,
                                description: pkg.description,
                                price: pkg.price,
                                duration_days: pkg.duration_days,
                                inclusions: pkg.inclusions,
                                valid_from: new Date().toISOString()
                            });
                    }
                    console.log(`Added ${packages.length} packages for ${resort.name}`);
                }
            } catch (e) {
                console.warn("Package Gen failed", e);
            }
        }
    }
    console.log("Enrichment Complete.");
}

enrichResorts();
