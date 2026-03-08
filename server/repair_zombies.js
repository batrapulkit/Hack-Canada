
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing SUPABASE env vars");
    process.exit(1);
}

const supabase = createClient(url, key);

async function repairZombies() {
    console.log("Starting Zombie Repair...");

    // 1. Get All Auth Users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) return console.error("Failed to list auth users:", authError);

    // 2. Get All Public Users
    const { data: publicUsers, error: publicError } = await supabase.from('users').select('id');
    if (publicError) return console.error("Failed to list public users:", publicError);

    const publicIds = new Set(publicUsers.map(u => u.id));
    const zombies = authUsers.filter(u => !publicIds.has(u.id));

    console.log(`Found ${zombies.length} zombies.`);

    for (const z of zombies) {
        console.log(`Reparing ${z.email} (${z.id})...`);

        // Check for agency
        let agencyId = null;
        const { data: agency } = await supabase.from('agencies').select('id').eq('contact_email', z.email).single();

        if (agency) {
            agencyId = agency.id;
        } else {
            // Create Agency
            const { data: newAgency, error: agErr } = await supabase.from('agencies').insert({
                agency_name: "Repaired Agency",
                contact_email: z.email,
                subscription_plan: 'free',
                max_users: 5
            }).select().single();
            if (!agErr) agencyId = newAgency.id;
        }

        // Insert User
        const { error: insErr } = await supabase.from('users').insert({
            id: z.id,
            email: z.email,
            name: z.user_metadata?.full_name || z.email.split('@')[0],
            role: 'admin',
            status: 'active',
            agency_id: agencyId,
            password_hash: 'managed_by_supabase', // Relies on Auth PW
            created_at: z.created_at
        });

        if (insErr) {
            console.error(`Failed to insert ${z.email}: ${insErr.message}`);
        } else {
            console.log(`✅ Restored ${z.email} to users table.`);
        }

        // AUTO CONFIRM EMAIL IF NOT CONFIRMED
        if (!z.email_confirmed_at) {
            const { error: confirmError } = await supabase.auth.admin.updateUserById(z.id, { email_confirm: true });
            if (!confirmError) console.log(`✅ Auto-confirmed email for ${z.email}`);
        }
    }
    console.log("Repair complete.");
}

repairZombies();
