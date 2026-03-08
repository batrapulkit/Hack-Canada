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

async function runMigration() {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    try {
        console.log('Applying infinite recursion fix...');
        const sqlPath = path.join(__dirname, 'migrations', '20260112_fix_infinite_recursion.sql');
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
