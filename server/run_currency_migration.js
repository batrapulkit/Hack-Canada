import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Try default
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(__dirname, '.env') });
}

console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Checking for .env at:', path.join(__dirname, '.env'));
try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    console.log('.env found, length:', envFile.length);
    // Don't print content for security, but check if DATABASE_URL is in it
    if (envFile.includes('DATABASE_URL')) {
        console.log('DATABASE_URL is present in .env file');
        // Manual parse if dotenv fails
        const lines = envFile.split('\n');
        for (const line of lines) {
            if (line.startsWith('DATABASE_URL=')) {
                process.env.DATABASE_URL = line.split('=')[1].trim();
                console.log('Manually extracted DATABASE_URL');
            }
        }
    } else {
        console.log('DATABASE_URL NOT present in .env file');
    }
} catch (e) {
    console.log('.env NOT found or unreadable:', e.message);
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    try {
        console.log('Applying currency column fix...');
        // Use path to the migration file I created in Step 29 ( wait, step 29 was correct? Yes, server/migrations/20260113_add_currency_to_itineraries.sql)
        const sqlPath = path.join(__dirname, 'migrations', '20260113_add_currency_to_itineraries.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Successfully applied fix!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (process.env.DATABASE_URL) {
    runMigration();
} else {
    console.log("No DATABASE_URL found, skipping PG migration.");
}
