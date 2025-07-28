import pool from '../db';

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
  const year = new Date().getFullYear();
  const result = await pool.query("SELECT COUNT(*) FROM loans WHERE EXTRACT(YEAR FROM created_at) = $1", [year]);
  const count = parseInt(result.rows[0].count, 10) + 1;
  return `LN-${year}-${pad(count, 4)}`;
}

function computeRepaymentSchedule(principal, interest_rate, term_months, start_date) {
  // Simple equal monthly payment schedule
  const payments = [];
  const monthly_rate = interest_rate / 100 / 12;
  const n = term_months;
  const pmt = principal * monthly_rate / (1 - Math.pow(1 + monthly_rate, -n));
  let date = new Date(start_date);
  for (let i = 0; i < n; i++) {
    payments.push({
      due_date: new Date(date.getFullYear(), date.getMonth() + i, date.getDate()),
      amount: Math.round(pmt * 100) / 100,
    });
  }
  return payments;
}

export async function GET() {
  const result = await pool.query('SELECT * FROM loans ORDER BY created_at DESC');
  return new Response(JSON.stringify(result.rows), { status: 200 });
}

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { company_id, principal, interest_rate, term_months, start_date, created_by } = await request.json();
  if (!company_id || !principal || !interest_rate || !term_months || !start_date || !created_by) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }
  const code = await generateLoanCode();
  const loanResult = await pool.query(
    'INSERT INTO loans (company_id, code, principal, interest_rate, term_months, start_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [company_id, code, principal, interest_rate, term_months, start_date, created_by]
  );
  // Compute and insert repayment schedule
  const repayments = computeRepaymentSchedule(principal, interest_rate, term_months, start_date);
  for (const r of repayments) {
    await pool.query(
      'INSERT INTO repayments (loan_id, due_date, amount) VALUES ($1, $2, $3)',
      [loanResult.rows[0].id, r.due_date, r.amount]
    );
  }
  return new Response(JSON.stringify(loanResult.rows[0]), { status: 201 });
}

export async function PUT(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id, principal, interest_rate, term_months, start_date, status } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing loan id' }), { status: 400 });
  }
  const result = await pool.query(
    'UPDATE loans SET principal = $1, interest_rate = $2, term_months = $3, start_date = $4, status = $5 WHERE id = $6 RETURNING *',
    [principal, interest_rate, term_months, start_date, status, id]
  );
  return new Response(JSON.stringify(result.rows[0]), { status: 200 });
}

export async function DELETE(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing loan id' }), { status: 400 });
  }
  await pool.query('DELETE FROM loans WHERE id = $1', [id]);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 