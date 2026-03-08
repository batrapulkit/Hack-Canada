
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be service role for admin

if (!url || !key) {
    console.error("Missing SUPABASE env vars");
    process.exit(1);
}

const supabase = createClient(url, key);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function cleanupZombies() {
    console.log("Analyzing for Zombie Users (Auth users without Public record)...");

    // 1. Get All Auth Users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Failed to list auth users:", authError);
        return;
    }

    // 2. Get All Public Users
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id');

    if (publicError) {
        console.error("Failed to list public users:", publicError);
        return;
    }

    const publicIds = new Set(publicUsers.map(u => u.id));
    const zombies = authUsers.filter(u => !publicIds.has(u.id));

    console.log(`Found ${zombies.length} zombie users.`);

    if (zombies.length === 0) {
        console.log("✅ System is clean. No action needed.");
        process.exit(0);
    }

    // List them
    zombies.forEach(z => {
        console.log(` - [ZOMBIE] ${z.email} (ID: ${z.id}) (Created: ${z.created_at})`);
    });

    const answer = await askQuestion("\nDo you want to DELETE these zombie users from Auth? (yes/no): ");

    if (answer.toLowerCase() === 'yes') {
        console.log("Deleting...");
        for (const z of zombies) {
            const { error } = await supabase.auth.admin.deleteUser(z.id);
            if (error) {
                console.error(`Failed to delete ${z.email}: ${error.message}`);
            } else {
                console.log(`Deleted ${z.email}`);
            }
        }
        console.log("Cleanup complete.");
    } else {
        console.log("Operation cancelled.");
    }

    rl.close();
    process.exit(0);
}

cleanupZombies();
