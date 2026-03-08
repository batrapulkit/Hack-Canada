
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Needed for some cloud DBs, safe for dev scripts usually
});

async function run() {
    try {
        const file = process.argv[2];
        if (!file) {
            console.error('Please provide a migration filename (e.g. 20260114_fix.sql)');
            process.exit(1);
        }

        const filePath = path.join(__dirname, 'migrations', file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Running migration: ${file}...`);

        await pool.query(sql);

        console.log('✅ Migration successful');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await pool.end();
    }
}

run();
