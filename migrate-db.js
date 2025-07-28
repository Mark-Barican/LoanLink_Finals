const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/loanlink',
  ssl: process.env.DATABASE_URL?.includes('neon') ? {
    rejectUnauthorized: false,
  } : false,
});

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Read and execute migration script
    const migrationScript = fs.readFileSync(path.join(__dirname, 'migrate-database.sql'), 'utf8');
    
    console.log('📝 Executing migration script...');
    await client.query(migrationScript);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    console.log('\n📊 Verifying migration...');
    
    // Check payments table structure
    const paymentsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Payments table columns:');
    paymentsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check repayments table structure
    const repaymentsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'repayments' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Repayments table columns:');
    repaymentsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // Count records
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM payments'),
      client.query('SELECT COUNT(*) as count FROM repayments')
    ]);
    
    console.log('\n📊 Record counts:');
    console.log(`   Payments: ${counts[0].rows[0].count}`);
    console.log(`   Repayments: ${counts[1].rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Database migration completed successfully!');
    console.log('The payments page should now work properly.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your DATABASE_URL is set in .env.local');
    console.log('2. Ensure you have write permissions to the database');
    console.log('3. Check that the database server is running');
  } finally {
    await pool.end();
  }
}

migrateDatabase(); 