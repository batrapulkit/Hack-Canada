import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

async function runMigration() {
    // Try to find the connection string
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error("❌ No DATABASE_URL or SUPABASE_DB_URL found in environment variables.");
        console.log("Please ensure you have the direct connection string in your .env file to run migrations.");
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Azure usually
    });

    try {
        await client.connect();
        console.log("Connected to database. Running migration...");

        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '20260205_create_system_settings.sql'), 'utf8');

        await client.query(sql);
        console.log("✅ Migration applied successfully: system_settings table created.");

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
