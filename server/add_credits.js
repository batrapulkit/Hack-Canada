import { supabase } from './src/config/supabase.js';

async function addCredits() {
    try {
        // Get the logged-in user's agency
        const email = 'demo@triponic.com'; // Target demo account

        console.log(`Looking for user: ${email}...`);

        // Find the user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, agency_id')
            .eq('email', email)
            .single();

        if (userError || !user) {
            console.error('User not found:', userError);
            return;
        }

        console.log(`Found user: ${user.name} (Agency ID: ${user.agency_id})`);

        // Get current agency details
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('agency_name, itinerary_credits')
            .eq('id', user.agency_id)
            .single();

        if (agencyError || !agency) {
            console.error('Agency not found:', agencyError);
            return;
        }

        const currentCredits = agency.itinerary_credits || 0;
        console.log(`\nCurrent agency: ${agency.agency_name}`);
        console.log(`Current credits: ${currentCredits}`);

        // Add credits (you can change this number)
        const creditsToAdd = 100;
        const newCredits = currentCredits + creditsToAdd;

        // Update the agency with new credits
        const { data: updated, error: updateError } = await supabase
            .from('agencies')
            .update({ itinerary_credits: newCredits })
            .eq('id', user.agency_id)
            .select()
            .single();

        if (updateError) {
            console.error('Failed to update credits:', updateError);
            return;
        }

        console.log(`\n✅ Successfully added ${creditsToAdd} credits!`);
        console.log(`New credit balance: ${newCredits}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

addCredits();
