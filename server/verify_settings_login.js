import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { login } from './src/controllers/authController.js'; // Importing controller logic if possible, or just hit API

// Mocking express req/res
const mockReq = (body, user) => ({
    body,
    user
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// We need to import the actual controller function to test it directly
// since we can't easily curl the running server (we are in the server dir)
import { changePassword } from './src/controllers/authController.js';

async function verifySettingsPasswordChange() {
    const email = 'Apatel@thetravelagentnextdoor.com';
    const currentPassword = 'password123';
    const newPassword = 'NewPassword2026!';

    console.log(`Verifying Change Password for: ${email}`);

    // 1. Get User ID
    const { data: user } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('email', email)
        .single();

    if (!user) {
        console.error("User not found");
        return;
    }

    console.log("User found. ID:", user.id);

    // 2. Call changePassword controller
    const req = mockReq({
        currentPassword: currentPassword,
        newPassword: newPassword
    }, { id: user.id });

    const res = mockRes();

    console.log("Attempting to change password...");
    await changePassword(req, res);

    if (res.statusCode && res.statusCode !== 200) {
        console.error("❌ Change Password Failed:", res.data);
    } else {
        console.log("✅ Change Password Response:", res.data);

        // 3. Verify changes
        const { data: updatedUser } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', user.id)
            .single();

        const isMatch = await bcrypt.compare(newPassword, updatedUser.password_hash);
        if (isMatch) {
            console.log("✅ VERIFICATION SUCCESS: Password changed to 'NewPassword2026!'");

            // Revert back to original for the user
            console.log("Reverting password to original...");
            const reqRevert = mockReq({
                currentPassword: newPassword,
                newPassword: currentPassword // password123
            }, { id: user.id });
            const resRevert = mockRes();
            await changePassword(reqRevert, resRevert);
            console.log("Password reverted to 'password123'.");
        } else {
            console.error("❌ VERIFICATION FAILED: Password hash not updated.");
        }
    }
}

verifySettingsPasswordChange();
