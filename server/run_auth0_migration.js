import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

async function run() {
    console.log("Attempting to connect to DB...");

    if (!process.env.SUPABASE_URL) {
        console.error("Error: SUPABASE_URL not found in environment.");
        process.exit(1);
    }

    // We need the postgres connection string for pg client. 
    // Check if we have DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error("Need DATABASE_URL to run pg client migrations");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Database.");

        const sqlPath = path.join(__dirname, 'migrations', '20260307_add_auth0_id.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing migration: ${path.basename(sqlPath)}`);
        await client.query(sql);

        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
