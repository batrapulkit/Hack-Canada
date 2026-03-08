import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function reloadSchema() {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    try {
        console.log('Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Reload signal sent!');
    } catch (e) {
        console.error('Failed to reload schema:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

if (process.env.DATABASE_URL) {
    reloadSchema();
} else {
    console.log("No DATABASE_URL found.");
}
