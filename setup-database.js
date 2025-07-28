const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/loanlink',
  ssl: process.env.DATABASE_URL?.includes('neon') ? {
    rejectUnauthorized: false,
  } : false,
});

async function setupDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'companies', 'loans', 'repayments', 'payments')
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('📋 Existing tables:', tables.rows.map(row => row.table_name));
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Please run the schema.sql file first.');
      console.log('   You can do this by:');
      console.log('   1. Connecting to your database');
      console.log('   2. Running: psql -d your_database -f schema.sql');
      console.log('   3. Running: psql -d your_database -f setup-users.sql');
    } else {
      console.log('✅ Database schema appears to be set up correctly.');
      
      // Count records in each table
      const counts = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM users'),
        client.query('SELECT COUNT(*) as count FROM companies'),
        client.query('SELECT COUNT(*) as count FROM loans'),
        client.query('SELECT COUNT(*) as count FROM repayments'),
        client.query('SELECT COUNT(*) as count FROM payments')
      ]);
      
      console.log('📊 Record counts:');
      console.log(`   Users: ${counts[0].rows[0].count}`);
      console.log(`   Companies: ${counts[1].rows[0].count}`);
      console.log(`   Loans: ${counts[2].rows[0].count}`);
      console.log(`   Repayments: ${counts[3].rows[0].count}`);
      console.log(`   Payments: ${counts[4].rows[0].count}`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your DATABASE_URL is set in .env.local');
    console.log('2. For Neon: DATABASE_URL=postgresql://user:pass@host/db?sslmode=require');
    console.log('3. For local: DATABASE_URL=postgresql://localhost:5432/loanlink');
    console.log('4. Ensure your database server is running');
    console.log('5. Check that the database exists and is accessible');
  } finally {
    await pool.end();
  }
}

setupDatabase(); 