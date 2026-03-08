
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function resetPassword() {
    const email = "pulkit@gmail.com";
    const newPassword = "password123";

    console.log(`Resetting password for ${email}...`);

    // 1. Update in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.admin.updateUserById(
        "921eb618-090f-48a7-8c3e-948548824cb2", // ID from previous logs
        { password: newPassword }
    );

    if (authError) {
        console.error("Auth update failed:", authError.message);
        // Try finding ID if hardcoded ID is wrong (just in case)
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const target = users.find(u => u.email === email);
        if (target) {
            console.log(`Found ID dynamically: ${target.id}`);
            await supabase.auth.admin.updateUserById(target.id, { password: newPassword });
        } else {
            return;
        }
    }

    // 2. Update Local Hash (just to be safe, though 'managed_by_supabase' should handle it)
    // Actually, let's keep it 'managed_by_supabase' BUT we can also set the hash so bcrypt fallback works!
    // The authController tries bcrypt fallback if Supabase Auth fails. 
    // But sending 'managed_by_supabase' triggers Auth first.
    // Let's just update Auth. That is sufficient for 'managed_by_supabase'.

    console.log("✅ Password reset to 'password123'.");
}

resetPassword();
