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

    if (!process.env.DATABASE_URL) {
        console.error("Error: DATABASE_URL not found in environment.");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase from external
    });

    try {
        await client.connect();
        console.log("Connected to Database.");

        const sqlPath = path.join(__dirname, 'migrations', '20260112_fix_infinite_recursion.sql');
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
