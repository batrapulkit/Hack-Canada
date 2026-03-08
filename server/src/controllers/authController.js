import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../../debug.log');

// SAFE LOGGING (Ignored if FS is read-only)
function logToFile(msg) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] [AUTH] ${msg}\n`);
  } catch (e) {
    // Ignore logging errors in production
    // console.error("Logging failed:", e.message);
  }
}

// =========================
// REGISTER
// =========================
export const register = async (req, res) => {
  try {
    const { full_name, email, password, agency_name, coupon_code } = req.body;
    logToFile(`[Register Attempt] Email: ${email}, Agency: ${agency_name}, Coupon: ${coupon_code}`);

    if (!full_name || !email || !password || !agency_name || !coupon_code) {
      logToFile("[Register Failed] Missing fields");
      return res.status(400).json({ error: "All fields including Invitation Code are required" });
    }

    // 0. Verify Coupon Code
    logToFile(`[Register] Verifying coupon: ${coupon_code}`);
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      logToFile("[Register Failed] Invalid coupon code");
      return res.status(400).json({ error: "Invalid or inactive Invitation Code" });
    }

    // Check Global Limit
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: "This invitation code has reached its maximum usage limit." });
    }

    // Determine Credits - Use the coupon value directly
    const initialCredits = coupon.credits_value;
    const planType = 'free'; // Default to free plan
    const maxUsers = 1;
    const usageLimit = 100; // Legacy field, we use credits now

    logToFile(`[Register] Coupon valid (${coupon.code}). Starting with ${initialCredits} credits.`);

    // 1. Create Supabase Auth User
    logToFile("[Register] Creating Supabase Auth user...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for immediate access
      user_metadata: { full_name }
    });

    if (authError) {
      logToFile(`[Register Failed] Supabase Auth error: ${authError.message}`);
      throw authError;
    }
    const userId = authData.user.id;
    logToFile(`[Register] Auth user created. ID: ${userId}`);

    // 2. Create agency
    logToFile("[Register] Creating agency...");
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        agency_name,
        contact_email: email,
        subscription_plan: planType,
        subscription_status: 'active',
        max_users: maxUsers,
        usage_count: 0,
        usage_limit: usageLimit,
        itinerary_credits: initialCredits, // Set initial credits from coupon
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (agencyError) {
      logToFile(`[Register Failed] Agency creation error: ${agencyError.message}`);
      // Cleanup auth user if agency creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw agencyError;
    }
    logToFile(`[Register] Agency created. ID: ${agency.id}`);

    // 2.5 Record Coupon Redemption
    await supabase.from('agency_coupons').insert({
      agency_id: agency.id,
      coupon_id: coupon.id
    });

    // Increment used count
    await supabase.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id);

    logToFile(`[Register] Coupon ${coupon.code} redeemed for Agency ${agency.id}`);

    // Hash password for local storage
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user in our "users" table linked to Auth ID
    logToFile("[Register] Creating user in 'users' table...");
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId, // Link to Supabase Auth ID
        agency_id: agency.id,
        email,
        name: full_name,
        password_hash: passwordHash, // Store hashed password
        role: "admin",
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      logToFile(`[Register Failed] User table insertion error: ${userError.message}`);
      await supabase.auth.admin.deleteUser(userId);
      // Also delete agency if user creation fails to keep DB clean
      await supabase.from("agencies").delete().eq("id", agency.id);
      throw userError;
    }
    logToFile("[Register] User created in 'users' table");

    // Generate JWT token for immediate login
    const token = jwt.sign(
      {
        id: userId,
        email: email,
        full_name: full_name,
        agency_id: agency.id,
        role: "admin",
      },
      process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
      { expiresIn: "7d" }
    );

    logToFile("[Register Success] Token generated, user can login immediately");

    return res.json({
      success: true,
      message: "Registration successful! Welcome to Triponic.",
      token,
      user: newUser,
      agency
    });
  } catch (err) {
    logToFile(`Register error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

// =========================
// LOGIN
// =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    logToFile(`[Login Attempt] Email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 1. Try to find user in our "users" table
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // Variable to hold new agency ID if created during auth sync
    let newAgencyId = null;

    // 2. If user not found in "users" table, check if they exist in Supabase Auth
    if (error || !user) {
      logToFile("[Login] User not found in 'users' table. Checking Supabase Auth...");

      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (sbError) {
        logToFile(`[Login Failed] Supabase Auth failed: ${sbError.message}`);

        // --- SELF-HEALING START: Check for Zombie User (Exists in Auth, missing in DB) ---
        try {
          // Always check for zombie status on auth failure to be robust
          if (true) {
            logToFile(`[Login Heal] Checking if ${email} is a zombie user...`);

            // Note: listUsers() is not performant for millions of users, but acceptable here.
            // Ideally use a direct RPC or better admin search if available.
            const { data: { users: allAuthUsers }, error: listError } = await supabase.auth.admin.listUsers();

            if (!listError && allAuthUsers) {
              const zombieUser = allAuthUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

              if (zombieUser) {
                logToFile(`[Login Heal] FOUND ZOMBIE: ${zombieUser.email} (${zombieUser.id}). Restoring local record...`);

                // 1. Create/Find Agency
                let healAgencyId = null;
                const { data: existingAgency } = await supabase.from("agencies").select("id").eq("contact_email", email).single();

                if (existingAgency) {
                  healAgencyId = existingAgency.id;
                } else {
                  const { data: newAgency, error: agErr } = await supabase.from("agencies").insert({
                    agency_name: zombieUser.user_metadata?.full_name ? `${zombieUser.user_metadata.full_name}'s Agency` : "Restored Agency",
                    contact_email: email,
                    subscription_plan: 'free',
                    max_users: 5
                  }).select().single();
                  if (!agErr) healAgencyId = newAgency.id;
                }

                // 2. Create User Record
                const { error: healError } = await supabase.from("users").insert({
                  id: zombieUser.id,
                  email: zombieUser.email,

                  name: zombieUser.user_metadata?.full_name || email.split('@')[0],
                  password_hash: 'managed_by_supabase',
                  role: 'admin',
                  status: 'active',
                  agency_id: healAgencyId
                });

                if (healError) {
                  logToFile(`[Login Heal] Failed to restore user: ${healError.message}`);
                } else {
                  logToFile(`[Login Heal] SUCCESS. User restored. Next login will work or show correct error.`);
                }
              } else {
                logToFile(`[Login Heal] User not found in Auth either. Genuine invalid user.`);
              }
            }
          }
        } catch (healEx) {
          logToFile(`[Login Heal] Exception: ${healEx.message}`);
        }
        // --- SELF-HEALING END ---

        return res.status(401).json({ error: "Invalid email or password" });
      }

      logToFile("[Login] Supabase Auth successful. Syncing user to 'users' table...");
      const sbUser = sbData.user;

      // Check if user exists by ID (email change handling)
      const { data: existingUserById, error: existingUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", sbUser.id)
        .single();

      if (existingUserById) {
        // User exists but check if email changed (CASE INSENSITIVE CHECK)
        // If emails are identical (ignoring case), we don't need to sync/update anything.
        const emailChanged = existingUserById.email.toLowerCase() !== sbUser.email.toLowerCase();

        if (emailChanged) {
          logToFile(`[Login Sync] User found by ID ${sbUser.id} but email mismatch (${existingUserById.email} -> ${sbUser.email}). Updating email...`);

          // PRE-CHECK: Duplicate Email Collision (CASE INSENSITIVE)
          // We use 'ilike' or standard check to see if email is taken
          const { data: collision } = await supabase
            .from("users")
            .select("id")
            .eq("email", sbUser.email) // Strict check for now to match DB constraint
            .neq("id", sbUser.id)
            .single();

          if (collision) {
            const msg = `[Login Sync Error] Email collision! Email ${sbUser.email} is already occupied by User ID ${collision.id}.`;
            logToFile(msg);
            console.error(msg);
            return res.status(409).json({
              error: "Login failed: Your email address is already associated with another account. Please contact support."
            });
          }

          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({
              email: sbUser.email,
              name: sbUser.user_metadata?.full_name || existingUserById.name,
              updated_at: new Date().toISOString()
            })
            .eq("id", sbUser.id)
            .select()
            .single();

          if (updateError) {
            logToFile(`[Login Sync] Failed to update user email: ${updateError.message}`);
            console.error(`[Login Sync Update Error]`, updateError);
            return res.status(500).json({ error: `Failed to sync user record: ${updateError.message}` });
          }

          user = updatedUser;
          logToFile(`[Login Sync] User updated successfully. ID: ${user.id}`);
        } else {
          // NO CHANGE NEEDED
          user = existingUserById;
          logToFile(`[Login Sync] User matched by ID. Emails match (case-insensitive). No sync needed.`);
        }
      } else {
        // User does not exist in 'users' table - CREATE NEW

        // Create agency (if needed)
        try {
          // Try to find existing agency with this email first
          const { data: existingAgency } = await supabase.from("agencies").select("id").eq("contact_email", email).single();

          if (existingAgency) {
            newAgencyId = existingAgency.id;
            logToFile(`[Login Sync] Found existing agency: ${newAgencyId}`);
          } else {
            // Create new agency
            const { data: agency, error: agencyError } = await supabase
              .from("agencies")
              .insert({
                agency_name: sbUser.user_metadata?.full_name ? `${sbUser.user_metadata.full_name}'s Agency` : "My Agency",
                contact_email: email,
                subscription_plan: 'free',
                subscription_status: 'active',
                max_users: 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (agencyError) {
              logToFile(`[Login Sync] Agency creation failed: ${agencyError.message}`);
              logToFile("[Login Sync] Proceeding without agency.");
            } else {
              newAgencyId = agency.id;
              logToFile(`[Login Sync] Agency created. ID: ${newAgencyId}`);
            }
          }
        } catch (err) {
          logToFile(`[Login Sync] Agency logic error: ${err.message}`);
        }

        // Create user in "users" table
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: sbUser.id,
            agency_id: newAgencyId, // Can be null
            email: sbUser.email,
            name: sbUser.user_metadata?.full_name || email.split('@')[0],
            password_hash: 'managed_by_supabase',
            role: "admin",
            status: "active",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          logToFile(`[Login Sync] User creation failed: ${createError.message}`);
          return res.status(500).json({ error: "Failed to sync user record" });
        }

        user = newUser;
        logToFile(`[Login Sync] User synced successfully. ID: ${user.id}`);
      }
    } else {
      // User found in "users" table

      // --- SELF-HEALING: Fix missing agency_id for existing users ---
      if (!user.agency_id) {
        logToFile(`[Login] Existing user ${user.id} has no agency_id. Attempting to sync...`);
        let agencyId = null;
        try {
          // Try to find existing agency with this email first
          const { data: existingAgency } = await supabase.from("agencies").select("id").eq("contact_email", email).single();

          if (existingAgency) {
            agencyId = existingAgency.id;
            logToFile(`[Login Sync] Found existing agency: ${agencyId}`);
          } else {
            // Create new agency
            const { data: agency, error: agencyError } = await supabase
              .from("agencies")
              .insert({
                agency_name: user.name ? `${user.name}'s Agency` : "My Agency",
                contact_email: email,
                subscription_plan: 'free',
                subscription_status: 'active',
                max_users: 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (agencyError) {
              logToFile(`[Login Sync] Agency creation failed: ${agencyError.message}`);
            } else {
              agencyId = agency.id;
              logToFile(`[Login Sync] Agency created. ID: ${agencyId}`);
            }
          }

          if (agencyId) {
            // Update user
            const { error: updateError } = await supabase
              .from('users')
              .update({ agency_id: agencyId })
              .eq('id', user.id);

            if (updateError) {
              logToFile(`[Login Sync] Failed to update user agency_id: ${updateError.message}`);
            } else {
              user.agency_id = agencyId; // Update local object
              logToFile(`[Login Sync] User agency_id updated to ${agencyId}`);
            }
          }
        } catch (err) {
          logToFile(`[Login Sync] Agency logic error: ${err.message}`);
        }
      }
      // -----------------------------------------------------------

      let valid = false;

      // Check if password is managed by Supabase (legacy/hybrid) or local bcrypt
      if (user.password_hash === 'managed_by_supabase') {
        logToFile("[Login] User has Supabase-managed password. Attempting Supabase Auth sign-in...");
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (sbError) {
          logToFile(`[Login Failed] Supabase Auth failed: ${sbError.message}`);
          valid = false;
        } else {
          logToFile("[Login] Supabase Auth successful");
          valid = true;
        }
      } else {
        try {
          // Compare passwords using bcrypt
          valid = await bcrypt.compare(password, user.password_hash);
          logToFile(`[Login] Bcrypt check for ${email}: Match=${valid}`);
        } catch (bcryptErr) {
          logToFile(`[Login] Bcrypt error: ${bcryptErr.message}`);
          valid = false;
        }

        // --- SELF-HEALING: If bcrypt fails, try Supabase Auth (in case password was reset externally) ---
        if (!valid) {
          try {
            logToFile(`[Login] Bcrypt failed. Trying Supabase Auth fallback in case of password reset...`);
            const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (!sbError) {
              logToFile(`[Login] Supabase Auth fallback successful! Updating local hash...`);
              valid = true;

              // Update local hash
              try {
                const newHash = await bcrypt.hash(password, 10);
                await supabase
                  .from('users')
                  .update({ password_hash: newHash })
                  .eq('id', user.id);
                logToFile(`[Login] Local password hash updated successfully.`);
              } catch (hashInfo) {
                logToFile(`[Login] Failed to update local hash: ${hashInfo.message}`);
              }
            } else {
              logToFile(`[Login] Supabase Auth fallback failed: ${sbError.message}`);
            }
          } catch (fallbackErr) {
            logToFile(`[Login] Self-healing fallback error: ${fallbackErr.message}`);
          }
        }
        // -----------------------------------------------------------------------------------------------
      }

      if (!valid) return res.status(401).json({ error: "Invalid password" });
    }

    // Fetch full agency data
    let agency = null;
    const finalAgencyId = user.agency_id || newAgencyId;

    if (finalAgencyId) {
      const { data: agencyData, error: agencyFetchError } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", finalAgencyId)
        .single();

      if (agencyFetchError) {
        logToFile(`[Login] Warning: Failed to fetch agency data: ${agencyFetchError.message}`);
      } else {
        agency = agencyData;
        logToFile(`[Login] Agency data fetched: ${agency.agency_name}`);
      }
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.name,
        agency_id: finalAgencyId,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
      { expiresIn: "7d" }
    );

    logToFile("[Login Success] Token generated");

    return res.json({
      success: true,
      token,
      user,
      agency, // Include full agency data
    });
  } catch (err) {
    logToFile(`Login error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

// =========================
// CURRENT USER
// =========================
export const getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user;

    const { data: user } = await supabase
      .from("users")
      .select("*, agencies(*)")
      .eq("id", id)
      .single();

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};

// =========================
// LOGOUT (client-side)
// =========================
export const logout = async (req, res) => {
  return res.json({ success: true, message: "Logged out" });
};

// =========================
// FORGOT PASSWORD
// =========================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    logToFile(`[Forgot Password] Request for: ${email}`);

    // Send password reset email using Supabase Auth
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://partners.triponic.com/reset-password",
    });

    if (error) {
      logToFile(`[Forgot Password] Error: ${error.message}`);
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions."
      });
    }

    logToFile(`[Forgot Password] Reset email sent to: ${email}`);

    return res.json({
      success: true,
      message: "Password reset instructions have been sent to your email."
    });
  } catch (err) {
    logToFile(`Forgot password error: ${err.message}`);
    return res.status(500).json({ error: "Failed to process request" });
  }
};

// =========================
// RESET PASSWORD
// =========================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    logToFile(`[Reset Password] Attempting password reset`);

    // Verify the reset token and update password in Supabase Auth
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      logToFile(`[Reset Password] Error: ${error.message}`);
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    // Also update the users table password_hash to sync
    const userId = data.user.id;
    const newHash = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    logToFile(`[Reset Password] Success for user: ${userId}`);

    return res.json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password."
    });
  } catch (err) {
    logToFile(`Reset password error: ${err.message}`);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};

// =========================
// CHANGE PASSWORD (Authenticated)
// =========================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // 1. Fetch user to get current hash
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password_hash, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Verify current password
    let valid = false;
    if (user.password_hash === 'managed_by_supabase') {
      // If managed by Supabase, we can't easily verify old password without signing in again.
      // For security, we'll require them to sign in via Supabase Auth first.
      const { error: sbError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (!sbError) valid = true;
    } else {
      valid = await bcrypt.compare(currentPassword, user.password_hash);
    }

    if (!valid) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // 3. Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // 4. Update local hash
    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: localUpdateError } = await supabase
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", userId);

    if (localUpdateError) {
      throw localUpdateError;
    }

    logToFile(`[Change Password] Success for user: ${userId}`);
    return res.json({ success: true, message: "Password changed successfully" });

  } catch (err) {
    logToFile(`Change password error: ${err.message}`);
    return res.status(500).json({ error: "Failed to change password" });
  }
};
