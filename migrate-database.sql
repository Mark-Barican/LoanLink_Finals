-- Comprehensive Database Migration Script
-- This script updates the existing database to match the new schema

-- 1. Add status column to repayments table if it doesn't exist
ALTER TABLE repayments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid';

-- 2. Update existing repayments to have status based on paid field
UPDATE repayments SET status = 'paid' WHERE paid = true;
UPDATE repayments SET status = 'unpaid' WHERE paid = false OR paid IS NULL;

-- 3. Add payment_date and method columns to payments table if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash';

-- 4. Update existing payments to have payment_date based on paid_at
UPDATE payments SET payment_date = paid_at::date WHERE payment_date IS NULL AND paid_at IS NOT NULL;

-- 5. Set default payment_date for any remaining null values
UPDATE payments SET payment_date = CURRENT_DATE WHERE payment_date IS NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_status ON repayments(status);
CREATE INDEX IF NOT EXISTS idx_payments_repayment_id ON payments(repayment_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- 7. Verify the migration
SELECT 'Migration completed successfully' as status;

-- 8. Show current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'repayments')
ORDER BY table_name, ordinal_position; 