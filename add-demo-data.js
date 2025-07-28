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

async function addDemoData() {
  try {
    console.log('🔄 Adding demo data to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Read and execute demo data script
    const demoDataScript = fs.readFileSync(path.join(__dirname, 'add-demo-data.sql'), 'utf8');
    
    console.log('📝 Executing demo data script...');
    await client.query(demoDataScript);
    
    console.log('✅ Demo data added successfully!');
    
    // Verify the data
    console.log('\n📊 Verifying demo data...');
    
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM companies'),
      client.query('SELECT COUNT(*) as count FROM loans'),
      client.query('SELECT COUNT(*) as count FROM repayments'),
      client.query('SELECT COUNT(*) as count FROM payments')
    ]);
    
    console.log('\n📋 Data summary:');
    console.log(`   Companies: ${counts[0].rows[0].count}`);
    console.log(`   Loans: ${counts[1].rows[0].count}`);
    console.log(`   Repayments: ${counts[2].rows[0].count}`);
    console.log(`   Payments: ${counts[3].rows[0].count}`);
    
    // Show financial summary
    const [loanAmounts, repaidAmounts] = await Promise.all([
      client.query('SELECT COALESCE(SUM(principal), 0) as total FROM loans'),
      client.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments')
    ]);
    
    const totalLoans = parseFloat(loanAmounts.rows[0]?.total || 0);
    const totalRepaid = parseFloat(repaidAmounts.rows[0]?.total || 0);
    const outstanding = totalLoans - totalRepaid;
    
    console.log('\n💰 Financial summary:');
    console.log(`   Total Loan Portfolio: $${totalLoans.toLocaleString()}`);
    console.log(`   Total Repaid: $${totalRepaid.toLocaleString()}`);
    console.log(`   Outstanding Balance: $${outstanding.toLocaleString()}`);
    
    client.release();
    console.log('\n🎉 Demo data setup completed!');
    console.log('Your dashboard should now show meaningful data.');
    
  } catch (error) {
    console.error('❌ Failed to add demo data:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your DATABASE_URL is set in .env.local');
    console.log('2. Ensure you have write permissions to the database');
    console.log('3. Check that the database server is running');
  } finally {
    await pool.end();
  }
}

addDemoData(); 