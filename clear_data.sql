-- SQL script to clear all data from payments, repayments, and loans tables
-- WARNING: This will permanently delete all data from these tables!

-- Clear payments table first (due to foreign key constraints)
DELETE FROM payments;

-- Clear repayments table
DELETE FROM repayments;

-- Clear loans table
DELETE FROM loans;

-- Reset auto-increment sequences (if using PostgreSQL)
-- Uncomment the following lines if you want to reset the ID sequences:

-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE repayments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE loans_id_seq RESTART WITH 1;

-- Verify the tables are empty
SELECT 'payments' as table_name, COUNT(*) as row_count FROM payments
UNION ALL
SELECT 'repayments' as table_name, COUNT(*) as row_count FROM repayments
UNION ALL
SELECT 'loans' as table_name, COUNT(*) as row_count FROM loans; 