-- Migration script to ensure all monetary values have 2 decimal places
-- This script updates existing data to maintain precision

-- Update loans table to ensure 2 decimal places
UPDATE loans 
SET 
  principal = ROUND(principal, 2),
  interest_rate = ROUND(interest_rate, 2),
  total_interest = ROUND(total_interest, 2),
  total_amount = ROUND(total_amount, 2)
WHERE 
  principal IS NOT NULL 
  OR interest_rate IS NOT NULL 
  OR total_interest IS NOT NULL 
  OR total_amount IS NOT NULL;

-- Update repayments table to ensure 2 decimal places
UPDATE repayments 
SET amount = ROUND(amount, 2)
WHERE amount IS NOT NULL;

-- Update payments table to ensure 2 decimal places
UPDATE payments 
SET amount = ROUND(amount, 2)
WHERE amount IS NOT NULL;

-- Verify the updates
SELECT 
  'loans' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN principal = ROUND(principal, 2) THEN 1 END) as principal_rounded,
  COUNT(CASE WHEN interest_rate = ROUND(interest_rate, 2) THEN 1 END) as interest_rate_rounded,
  COUNT(CASE WHEN total_interest = ROUND(total_interest, 2) THEN 1 END) as total_interest_rounded,
  COUNT(CASE WHEN total_amount = ROUND(total_amount, 2) THEN 1 END) as total_amount_rounded
FROM loans
UNION ALL
SELECT 
  'repayments' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN amount = ROUND(amount, 2) THEN 1 END) as amount_rounded,
  NULL, NULL, NULL
FROM repayments
UNION ALL
SELECT 
  'payments' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN amount = ROUND(amount, 2) THEN 1 END) as amount_rounded,
  NULL, NULL, NULL
FROM payments; 