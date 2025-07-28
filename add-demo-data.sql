-- Add Demo Data for LoanLink Dashboard
-- This script adds sample data to make the dashboard more meaningful

-- Add demo companies (matching the actual table structure)
INSERT INTO companies (name, industry, address, tin, contact_person) VALUES
('TechCorp Solutions', 'Technology', '123 Tech Street, Silicon Valley, CA 94025', 'TIN-001-2024', 'John Smith'),
('Green Energy Co', 'Renewable Energy', '456 Green Avenue, Portland, OR 97201', 'TIN-002-2024', 'Sarah Johnson'),
('Global Logistics Ltd', 'Transportation', '789 Logistics Blvd, Chicago, IL 60601', 'TIN-003-2024', 'Michael Chen'),
('HealthCare Plus', 'Healthcare', '321 Medical Center Dr, Boston, MA 02108', 'TIN-004-2024', 'Dr. Emily Davis'),
('Creative Studios', 'Entertainment', '654 Creative Lane, Los Angeles, CA 90210', 'TIN-005-2024', 'Alex Rodriguez');

-- Add demo loans (matching the actual table structure) - using first available user
INSERT INTO loans (company_id, code, principal, interest_rate, term_months, start_date, status, created_by) VALUES
((SELECT id FROM companies WHERE name = 'TechCorp Solutions' LIMIT 1), 'LOAN-001-2024', 500000, 8.5, 12, '2024-01-15', 'active', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM companies WHERE name = 'Green Energy Co' LIMIT 1), 'LOAN-002-2024', 750000, 7.2, 18, '2024-02-01', 'active', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM companies WHERE name = 'Global Logistics Ltd' LIMIT 1), 'LOAN-003-2024', 300000, 9.0, 12, '2024-03-10', 'active', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM companies WHERE name = 'HealthCare Plus' LIMIT 1), 'LOAN-004-2024', 1200000, 6.8, 24, '2024-01-20', 'active', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM companies WHERE name = 'Creative Studios' LIMIT 1), 'LOAN-005-2024', 250000, 10.5, 12, '2024-04-01', 'active', (SELECT id FROM users LIMIT 1));

-- Add demo repayments
INSERT INTO repayments (loan_id, due_date, amount, status) VALUES
((SELECT id FROM loans WHERE code = 'LOAN-001-2024' LIMIT 1), '2024-02-15', 50000, 'paid'),
((SELECT id FROM loans WHERE code = 'LOAN-001-2024' LIMIT 1), '2024-03-15', 50000, 'paid'),
((SELECT id FROM loans WHERE code = 'LOAN-001-2024' LIMIT 1), '2024-04-15', 50000, 'unpaid'),
((SELECT id FROM loans WHERE code = 'LOAN-002-2024' LIMIT 1), '2024-03-01', 75000, 'paid'),
((SELECT id FROM loans WHERE code = 'LOAN-002-2024' LIMIT 1), '2024-04-01', 75000, 'unpaid'),
((SELECT id FROM loans WHERE code = 'LOAN-003-2024' LIMIT 1), '2024-04-10', 30000, 'unpaid'),
((SELECT id FROM loans WHERE code = 'LOAN-004-2024' LIMIT 1), '2024-02-20', 120000, 'paid'),
((SELECT id FROM loans WHERE code = 'LOAN-004-2024' LIMIT 1), '2024-03-20', 120000, 'unpaid'),
((SELECT id FROM loans WHERE code = 'LOAN-005-2024' LIMIT 1), '2024-05-01', 25000, 'unpaid');

-- Add demo payments - using first available user
INSERT INTO payments (repayment_id, amount, payment_date, method, created_by) VALUES
((SELECT id FROM repayments WHERE status = 'paid' AND loan_id = (SELECT id FROM loans WHERE code = 'LOAN-001-2024' LIMIT 1) LIMIT 1), 50000, '2024-02-15', 'bank_transfer', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM repayments WHERE status = 'paid' AND loan_id = (SELECT id FROM loans WHERE code = 'LOAN-001-2024' LIMIT 1) OFFSET 1 LIMIT 1), 50000, '2024-03-15', 'bank_transfer', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM repayments WHERE status = 'paid' AND loan_id = (SELECT id FROM loans WHERE code = 'LOAN-002-2024' LIMIT 1) LIMIT 1), 75000, '2024-03-01', 'bank_transfer', (SELECT id FROM users LIMIT 1)),
((SELECT id FROM repayments WHERE status = 'paid' AND loan_id = (SELECT id FROM loans WHERE code = 'LOAN-004-2024' LIMIT 1) LIMIT 1), 120000, '2024-02-20', 'bank_transfer', (SELECT id FROM users LIMIT 1));

-- Update repayment status to paid where payments exist
UPDATE repayments SET status = 'paid', paid = true, paid_at = CURRENT_TIMESTAMP 
WHERE id IN (SELECT repayment_id FROM payments);

-- Show summary of added data
SELECT 'Demo data added successfully!' as status;

SELECT 'Companies added:' as info, COUNT(*) as count FROM companies;
SELECT 'Loans added:' as info, COUNT(*) as count FROM loans;
SELECT 'Repayments added:' as info, COUNT(*) as count FROM repayments;
SELECT 'Payments added:' as info, COUNT(*) as count FROM payments; 