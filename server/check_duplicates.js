
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from 'crypto';

// Load env
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

async function checkDuplicates() {
    console.log("Checking for duplicate emails in 'users' table...");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, agency_id, created_at, updated_at');

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const emailMap = {};
    const duplicates = [];

    users.forEach(u => {
        const email = u.email ? u.email.toLowerCase() : 'null';
        if (emailMap[email]) {
            duplicates.push({
                email,
                users: [emailMap[email], u]
            });
            console.log(`❌ Found Duplicate! Email: ${email}`);
        } else {
            emailMap[email] = u;
        }
    });

    if (duplicates.length === 0) {
        console.log("✅ No duplicate emails found in 'users' table.");
    }

    // TEST CONSTRAINT: Try to insert a user with an existing email but NEW ID
    if (users.length > 0) {
        console.log("\nTesting Unique Constraint on Email...");
        const existing = users[0];
        const newId = crypto.randomUUID();

        console.log(`Attempting to insert user with ID: ${newId} and Email: ${existing.email}`);

        try {
            const { error: insertError } = await supabase.from('users').insert({
                id: newId,
                email: existing.email, // DUPLICATE
                name: 'Test Duplicate Constraint',
                role: 'agent',
                status: 'active'
            });

            if (insertError) {
                console.log(`✅ Insert Failed as expected.`);
                console.log(`   Error Message: ${insertError.message}`);
                if (insertError.message.includes('unique') || insertError.code === '23505') {
                    console.log("   -> Confirmed: Unique Constraint on EMAIL is active.");
                } else {
                    console.log("   -> Status: Failed, but maybe not unique constraint?");
                }
            } else {
                console.error("❌ WARNING: Insert SUCCESS. Email Unique Constraint is MISSING or BROKEN!");
                // Cleanup
                await supabase.from('users').delete().eq('id', newId);
            }
        } catch (e) {
            console.log(`Exception: ${e.message}`);
        }
    } else {
        console.log("Skipping constraint test (no users to duplicate).");
    }
}

checkDuplicates();
