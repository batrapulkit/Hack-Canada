
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function check() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return console.error(error);
    users.forEach(u => {
        const providers = u.app_metadata.providers || [];
        console.log(`User: ${u.email}`);
        console.log(`  - Zombie Check: NEEDED (I can't check local here easily without huge query but I know pulkit is zombie)`);
        console.log(`  - Providers: ${JSON.stringify(providers)}`);
        console.log(`  - Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
        console.log(`  - Ban Status: ${u.banned_until || 'None'}`);
        console.log("------------------------------------------------");
    });
}
check();
