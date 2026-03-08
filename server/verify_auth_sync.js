
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

async function verifySync() {
    console.log("Auditing User Sync State...");

    // 1. Get All Auth Users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Failed to list auth users:", authError);
        return;
    }

    // 2. Get All Public Users
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*');

    if (publicError) {
        console.error("Failed to list public users:", publicError);
        return;
    }

    console.log(`Auth Users: ${authUsers.length} | Public Users: ${publicUsers.length}`);

    const publicMap = new Map(publicUsers.map(u => [u.id, u]));

    for (const authUser of authUsers) {
        const publicUser = publicMap.get(authUser.id);

        if (!publicUser) {
            console.log(`[ZOMBIE] Auth User ${authUser.email} (${authUser.id}) has NO public record.`);
        } else {
            // Check Email Mismatch
            if (authUser.email !== publicUser.email) {
                console.log(`[MISMATCH] ID: ${authUser.id}`);
                console.log(`  Auth:   ${authUser.email}`);
                console.log(`  Public: ${publicUser.email}`);

                if (authUser.email.toLowerCase() === publicUser.email.toLowerCase()) {
                    console.log(`  -> CASE SENSITIVITY PROBLEM!`);
                } else {
                    console.log(`  -> REAL CHANGE.`);
                }
            }
        }
    }
}

verifySync();
