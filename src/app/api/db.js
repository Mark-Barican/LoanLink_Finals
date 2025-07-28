import { Pool } from 'pg';

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set. Please create a .env.local file with your database connection string.');
  console.warn('Example: DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require');
}

// Use environment variables for security
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/loanlink',
  // Add SSL for Neon (only if using Neon)
  ssl: process.env.DATABASE_URL?.includes('neon') ? {
    rejectUnauthorized: false,
  } : false,
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export both pool and query function
export default pool;

export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
} 