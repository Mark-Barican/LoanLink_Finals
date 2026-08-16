import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Create .env.local with your connection string.');
  console.warn('Example: DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require');
}

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/loanlink';

// Hosted Postgres (Neon, Supabase, Railway) terminates TLS at the pooler and
// presents a certificate the default trust store does not chain to, so verify
// is disabled for those. A plain local socket needs no TLS at all.
const needsSsl = /sslmode=require|\.neon\.tech|supabase\.co|railway\.app/.test(connectionString);

// Next reloads modules in development; reuse one pool so we do not leak
// connections on every hot update.
const globalForPg = globalThis;

const pool =
  globalForPg.__loanlinkPool ||
  new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    maxUses: 7500,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__loanlinkPool = pool;
}

// An idle client dropping is normal with a serverless Postgres pooler. Log it
// and let the pool replace the client rather than taking the process down.
pool.on('error', (err) => {
  console.error('Idle database client error:', err.message);
});

export default pool;

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Run a set of statements on one checked-out client so BEGIN/COMMIT actually
 * apply to them. Issuing BEGIN through the pool hands each statement whichever
 * client is free, which silently defeats the transaction.
 */
export async function withTransaction(run) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run((text, params) => client.query(text, params));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}
