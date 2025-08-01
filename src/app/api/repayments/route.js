import { query } from '../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const loan_id = url.searchParams.get('loan_id');
    const company_id = url.searchParams.get('company_id');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;
    
    let result;
    let totalCount;
    
    if (company_id) {
      // Filter by company - join with loans to get company_id
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE l.company_id = $1
      `, [company_id]);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT r.*, l.code as loan_code, l.principal, l.interest_rate, l.term_months,
               c.name as company_name, c.industry as company_industry
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE l.company_id = $1
        ORDER BY r.due_date
        LIMIT $2 OFFSET $3
      `, [company_id, limit, offset]);
    } else if (loan_id) {
      // Filter by specific loan
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE r.loan_id = $1
      `, [loan_id]);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT r.*, l.code as loan_code, l.principal, l.interest_rate, l.term_months,
               c.name as company_name, c.industry as company_industry
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE r.loan_id = $1
        ORDER BY r.due_date
        LIMIT $2 OFFSET $3
      `, [loan_id, limit, offset]);
    } else {
      // Get all repayments with company and loan info
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
      `);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT r.*, l.code as loan_code, l.principal, l.interest_rate, l.term_months,
               c.name as company_name, c.industry as company_industry
        FROM repayments r
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        ORDER BY r.due_date
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return Response.json({
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('GET repayments error:', error);
    return Response.json({ error: 'Failed to fetch repayments' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { loan_id, due_date, amount, status = 'unpaid' } = await request.json();
  if (!loan_id || !due_date || !amount) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }
  const result = await query(
    'INSERT INTO repayments (loan_id, due_date, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [loan_id, due_date, amount, status]
  );
  return Response.json(result.rows[0], { status: 201 });
}

export async function PUT(request) {
  if (!isAdminOrManager(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, due_date, amount, status } = await request.json();
  if (!id) {
    return Response.json({ error: 'Missing repayment id' }, { status: 400 });
  }
  
  // Update both status and paid fields for compatibility
  const paid = status === 'paid';
  const paid_at = status === 'paid' ? new Date().toISOString() : null;
  
  const result = await query(
    'UPDATE repayments SET due_date = $1, amount = $2, status = $3, paid = $4, paid_at = $5 WHERE id = $6 RETURNING *',
    [due_date, amount, status, paid, paid_at, id]
  );
  return Response.json(result.rows[0], { status: 200 });
}

export async function DELETE(request) {
  if (!isAdminOrManager(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: 'Missing repayment id' }, { status: 400 });
  }
  await query('DELETE FROM repayments WHERE id = $1', [id]);
  return Response.json({ success: true }, { status: 200 });
} 