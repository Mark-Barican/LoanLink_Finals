import { query } from '../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

function pad(num, size) {
  let s = num+'';
  while (s.length < size) s = '0' + s;
  return s;
}

async function generateLoanCode() {
  try {
    const year = new Date().getFullYear();
    const result = await query("SELECT COUNT(*) FROM loans WHERE EXTRACT(YEAR FROM created_at) = $1", [year]);
    const count = parseInt(result.rows[0].count, 10) + 1;
    return `LN-${year}-${pad(count, 4)}`;
  } catch (error) {
    console.error('Error generating loan code:', error);
    // Fallback to timestamp-based code
    const timestamp = Date.now().toString().slice(-6);
    return `LN-${new Date().getFullYear()}-${timestamp}`;
  }
}

function computeRepaymentSchedule(principal, interest_rate, term_months, start_date) {
  try {
    // Philippine Add-On Interest Method
    // Total Interest = Principal × Interest Rate × Loan Term (in years)
    // Total Amount = Principal + Total Interest
    // Monthly Payment = Total Amount ÷ Number of Months
    
    const payments = [];
    const term_years = term_months / 12;
    const total_interest = parseFloat((principal * (interest_rate / 100) * term_years).toFixed(2));
    const total_amount = parseFloat((principal + total_interest).toFixed(2));
    const monthly_payment = parseFloat((total_amount / term_months).toFixed(2));
    
    let date = new Date(start_date);
    
    for (let i = 0; i < term_months; i++) {
      payments.push({
        due_date: new Date(date.getFullYear(), date.getMonth() + i, date.getDate()),
        amount: parseFloat(monthly_payment.toFixed(2)),
      });
    }
    
    return {
      payments,
      total_interest: parseFloat(total_interest.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2)),
      monthly_payment: parseFloat(monthly_payment.toFixed(2))
    };
  } catch (error) {
    console.error('Error computing repayment schedule:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const result = await query('SELECT * FROM loans ORDER BY created_at DESC');
    return Response.json(result.rows);
  } catch (error) {
    console.error('GET loans error:', error);
    return Response.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    console.log('POST loan request body:', body);
    
    const { company_id, principal, interest_rate, term_months, start_date, created_by } = body;
    
    // Validate required fields
    if (!company_id || !principal || !interest_rate || !term_months || !start_date || !created_by) {
      console.error('Missing required fields:', { company_id, principal, interest_rate, term_months, start_date, created_by });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate data types
    const principalNum = parseFloat(principal);
    const interestRateNum = parseFloat(interest_rate);
    const termMonthsNum = parseInt(term_months);
    
    if (isNaN(principalNum) || isNaN(interestRateNum) || isNaN(termMonthsNum)) {
      return Response.json({ error: 'Invalid numeric values' }, { status: 400 });
    }

    // Check if company exists
    const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
    if (companyCheck.rows.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 400 });
    }

    // Check if user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [created_by]);
    if (userCheck.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 400 });
    }

    // Generate unique loan code
    const code = await generateLoanCode();
    console.log('Generated loan code:', code);
    
    // Compute loan details using Philippine Add-On Interest Method
    const loanCalculation = computeRepaymentSchedule(principalNum, interestRateNum, termMonthsNum, start_date);
    
    // Insert the loan with total_interest field
    const loanResult = await query(
      'INSERT INTO loans (company_id, code, principal, interest_rate, term_months, start_date, created_by, status, total_interest, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [company_id, code, principalNum, interestRateNum, termMonthsNum, start_date, created_by, 'active', loanCalculation.total_interest, loanCalculation.total_amount]
    );

    console.log('Loan created:', loanResult.rows[0]);

    // Compute and insert repayment schedule
    console.log('Computed repayments:', loanCalculation.payments.length);
    
    for (const r of loanCalculation.payments) {
      await query(
        'INSERT INTO repayments (loan_id, due_date, amount, status) VALUES ($1, $2, $3, $4)',
        [loanResult.rows[0].id, r.due_date, r.amount, 'unpaid']
      );
    }

    console.log('Repayment schedule created successfully');
    return Response.json(loanResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST loan error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return Response.json({ 
      error: 'Failed to create loan',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    }, { status: 500 });
  }
}

 