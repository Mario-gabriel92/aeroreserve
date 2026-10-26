import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 20, // Limită maximă de conexiuni din pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

export async function query(text: string, params?: (string | number | boolean | null)[]) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
}