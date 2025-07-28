import pool from '../db';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET(request) {
  const url = new URL(request.url);
  const repayment_id = url.searchParams.get('repayment_id');
  let result;
  
  try {
    if (repayment_id) {
      result = await pool.query('SELECT * FROM payments WHERE repayment_id = $1 ORDER BY COALESCE(payment_date, paid_at::date)', [repayment_id]);
    } else {
      result = await pool.query('SELECT * FROM payments ORDER BY COALESCE(payment_date, paid_at::date)');
    }
    
    // Transform the data to ensure consistent format
    const transformedRows = result.rows.map(row => ({
      ...row,
      payment_date: row.payment_date || (row.paid_at ? new Date(row.paid_at).toISOString().split('T')[0] : null),
      method: row.method || 'cash'
    }));
    
    return new Response(JSON.stringify(transformedRows), { status: 200 });
  } catch (error) {
    console.error('Payments GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load payments' }), { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  
  try {
    const { repayment_id, amount, payment_date, method = 'cash', created_by } = await request.json();
    if (!repayment_id || !amount || !payment_date) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }
    
    const result = await pool.query(
      'INSERT INTO payments (repayment_id, amount, payment_date, method, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [repayment_id, amount, payment_date, method, created_by]
    );
    
    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Payments POST error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create payment' }), { status: 500 });
  }
}

export async function PUT(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  
  try {
    const { id, amount, payment_date, method } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing payment id' }), { status: 400 });
    }
    
    const result = await pool.query(
      'UPDATE payments SET amount = $1, payment_date = $2, method = $3 WHERE id = $4 RETURNING *',
      [amount, payment_date, method, id]
    );
    
    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (error) {
    console.error('Payments PUT error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update payment' }), { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  
  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing payment id' }), { status: 400 });
    }
    
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Payments DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete payment' }), { status: 500 });
  }
} 