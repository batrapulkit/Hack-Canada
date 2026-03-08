
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) { console.error("Missing ENV"); process.exit(1); }

const supabase = createClient(url, key);

async function check() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return console.error(error);
    users.forEach(u => {
        console.log(`Email: ${u.email} | Providers: ${JSON.stringify(u.app_metadata.providers)} | Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
    });
}
check();
