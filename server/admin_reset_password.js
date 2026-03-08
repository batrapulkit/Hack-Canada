import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
    const email = 'Apatel@thetravelagentnextdoor.com';
    const newPassword = 'password123';

    console.log(`Resetting password for: ${email} to '${newPassword}'`);

    try {
        // 1. Get User ID from local table (most reliable for our logic)
        const { data: localUser, error: localError } = await supabase
            .from('users')
            .select('id, password_hash')
            .eq('email', email)
            .single();

        if (localError || !localUser) {
            console.error("User not found in local DB!", localError);
            return;
        }

        console.log(`Found User ID: ${localUser.id}`);
        // console.log(`Old Hash: ${localUser.password_hash?.substring(0, 10)}...`); // Removed this line

        // 2. Update Supabase Auth Password
        console.log("Updating Supabase Auth...");
        const { error: authError } = await supabase.auth.admin.updateUserById(
            localUser.id,
            { password: newPassword, email_confirm: true }
        );

        if (authError) {
            console.error("Failed to update Supabase Auth:", authError);
            // We might continue if it's just a sync issue, but let's see.
        } else {
            console.log("Supabase Auth password updated.");
        }

        // 3. Update Local 'users' table
        console.log("Updating local 'users' table...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error: dbError } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
            })
            .eq('id', localUser.id);

        if (dbError) {
            console.error("Failed to update local DB:", dbError);
            throw dbError;
        }

        console.log("Local database updated successfully.");

        // 4. Verification Step
        console.log("Verifying password...");
        const { data: verifyUser } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', localUser.id)
            .single();

        const isMatch = await bcrypt.compare(newPassword, verifyUser.password_hash);
        if (isMatch) {
            console.log("✅ VERIFICATION SUCCESS: Password matches hash.");
        } else {
            console.error("❌ VERIFICATION FAILED: Password does not match hash.");
        }

        // Verify immediately // Removed this block
        // const { data: verifyUser } = await supabase
        //     .from('users')
        //     .select('password_hash')
        //     .eq('id', localUser.id)
        //     .single();

        // console.log(`New Hash: ${verifyUser.password_hash?.substring(0, 10)}...`); // Removed this line
        console.log("---------------------------------------------------");
        console.log(`PASSWORD RESET COMPLETE.`);
        console.log(`Email: ${email}`);
        console.log(`New Password: ${newPassword}`);
        console.log("---------------------------------------------------");

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

resetPassword();
