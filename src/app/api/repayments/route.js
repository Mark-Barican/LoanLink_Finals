import pool from '../db';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET(request) {
  const url = new URL(request.url);
  const loan_id = url.searchParams.get('loan_id');
  let result;
  if (loan_id) {
    result = await pool.query('SELECT * FROM repayments WHERE loan_id = $1 ORDER BY due_date', [loan_id]);
  } else {
    result = await pool.query('SELECT * FROM repayments ORDER BY due_date');
  }
  return new Response(JSON.stringify(result.rows), { status: 200 });
}

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { loan_id, due_date, amount, status = 'unpaid' } = await request.json();
  if (!loan_id || !due_date || !amount) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }
  const result = await pool.query(
    'INSERT INTO repayments (loan_id, due_date, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [loan_id, due_date, amount, status]
  );
  return new Response(JSON.stringify(result.rows[0]), { status: 201 });
}

export async function PUT(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id, due_date, amount, status } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing repayment id' }), { status: 400 });
  }
  
  // Update both status and paid fields for compatibility
  const paid = status === 'paid';
  const paid_at = status === 'paid' ? new Date().toISOString() : null;
  
  const result = await pool.query(
    'UPDATE repayments SET due_date = $1, amount = $2, status = $3, paid = $4, paid_at = $5 WHERE id = $6 RETURNING *',
    [due_date, amount, status, paid, paid_at, id]
  );
  return new Response(JSON.stringify(result.rows[0]), { status: 200 });
}

export async function DELETE(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing repayment id' }), { status: 400 });
  }
  await pool.query('DELETE FROM repayments WHERE id = $1', [id]);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 