import { Pool } from 'pg';

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set. Please create a .env.local file with your database connection string.');
  console.warn('Example: DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require');
}

// Use environment variables for security
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/loanlink',
  // Add SSL for production (Vercel, Neon, etc.)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
  // Connection pool settings for better performance
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Additional production optimizations
  allowExitOnIdle: true,
  maxUses: 7500,
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export both pool and query function
export default pool;

export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  process.exit(0);
}); 