import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

function logToDebug(msg) {
  console.log(`[SUPABASE_CONFIG] ${msg}`);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Decode JWT to check role
try {
  const payload = JSON.parse(atob(key.split('.')[1]));
  logToDebug(`Key Role: ${payload.role}`);
  logToDebug(`Key ISS: ${payload.iss}`);
} catch (e) {
  logToDebug(`Failed to decode key: ${e.message}`);
}

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
