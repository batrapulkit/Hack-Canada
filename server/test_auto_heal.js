
import axios from 'axios';
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

async function testAutoHeal() {
    const email = "zombie_test@example.com";
    const password = "correct_password123";

    console.log("1. Cleaning up previous test...");
    // Cleanup: Delete from Auth AND Public
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);
    if (existing) await supabase.auth.admin.deleteUser(existing.id);
    await supabase.from('users').delete().eq('email', email);
    await supabase.from('agencies').delete().eq('contact_email', email);

    console.log("2. Creating ZOMBIE (Auth only)...");
    const { data: authUser, error: mkErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Zombie Tester" }
    });
    if (mkErr) return console.error("Failed to create auth user:", mkErr);
    console.log("Zombie created in Auth. NOT in public DB.");

    console.log("3. Attempting Login with WRONG password (should trigger heal)...");
    try {
        await axios.post('http://localhost:5000/api/auth/login', {
            email,
            password: "WRONG_PASSWORD"
        });
    } catch (e) {
        console.log(`Login failed as expected: ${e.response?.status} ${e.response?.data?.error}`);
    }

    // Wait a moment for async heal (though it is awaited in controller, so it should be done)

    console.log("4. Verifying PUBLIC DB...");
    const { data: publicUser } = await supabase.from('users').select('*').eq('email', email).single();

    if (publicUser) {
        console.log("✅ SUCCESS! User was auto-healed and found in public DB.");
        console.log(publicUser);
    } else {
        console.error("❌ FAILURE! User was NOT healed.");
    }

    // Cleanup
    console.log("5. Cleaning up...");
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from('users').delete().eq('id', authUser.user.id);
    await supabase.from('agencies').delete().eq('contact_email', email);
}

testAutoHeal();
