
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

async function checkStatus() {
    console.log("Checking Auth User Status...");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    users.forEach(u => {
        console.log(`\nEmail: ${u.email}`);
        console.log(`ID: ${u.id}`);
        console.log(`Confirmed At: ${u.email_confirmed_at}`);
        console.log(`Last Sign In: ${u.last_sign_in_at}`);
        console.log(`Banned Until: ${u.banned_until}`);
        console.log(`Metadata:`, u.user_metadata);
        console.log(`Providers:`, u.app_metadata.providers);
    });
}

checkStatus();
