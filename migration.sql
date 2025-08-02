-- Migration script to add Philippine loan calculation fields
-- Run this script to update existing database schema

-- Add new columns to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_interest DECIMAL(15,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);

-- Update existing loans with calculated values using Philippine Add-On Interest Method
UPDATE loans 
SET 
  total_interest = ROUND(principal * (interest_rate / 100) * (term_months / 12), 2),
  total_amount = ROUND(principal + (principal * (interest_rate / 100) * (term_months / 12)), 2)
WHERE total_interest IS NULL OR total_amount IS NULL;

-- Make the new columns NOT NULL after populating them
ALTER TABLE loans ALTER COLUMN total_interest SET NOT NULL;
ALTER TABLE loans ALTER COLUMN total_amount SET NOT NULL;

-- Add comments to document the Philippine calculation method
COMMENT ON COLUMN loans.total_interest IS 'Total interest calculated using Philippine Add-On Interest Method: Principal × Interest Rate × Term (in years)';
COMMENT ON COLUMN loans.total_amount IS 'Total amount to be repaid: Principal + Total Interest';

-- Ensure all monetary values have 2 decimal places for accuracy
UPDATE loans 
SET 
  principal = ROUND(principal, 2),
  interest_rate = ROUND(interest_rate, 2),
  total_interest = ROUND(total_interest, 2),
  total_amount = ROUND(total_amount, 2);

UPDATE repayments 
SET amount = ROUND(amount, 2);

UPDATE payments 
SET amount = ROUND(amount, 2); 