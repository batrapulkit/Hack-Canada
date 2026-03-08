import { supabase } from './src/config/supabase.js';

async function checkUser() {
    const email = 'Apatel@thetravelagentnextdoor.com';
    console.log(`Checking user with email: ${email}`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error("Error fetching user:", error);
        return;
    }

    if (!user) {
        console.log("User NOT found!");
    } else {
        console.log("User Found:");
        console.log(`- ID: ${user.id}`);
        console.log(`- Status: ${user.status}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Password Hash exists: ${!!user.password_hash}`);
        console.log(`- Password Hash length: ${user.password_hash ? user.password_hash.length : 0}`);
        console.log(`- Agency ID: ${user.agency_id}`);

        if (user.agency_id) {
            const { data: agency, error: agencyError } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', user.agency_id)
                .single();

            if (agencyError) {
                console.error("Error fetching agency:", agencyError);
            } else {
                console.log(`Agency Found: ${agency.agency_name} (ID: ${agency.id})`);
            }
        }
    }
}

checkUser();
