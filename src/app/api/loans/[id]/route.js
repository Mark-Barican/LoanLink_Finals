import { query } from '../../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const result = await query('SELECT * FROM loans WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Loan not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('GET loan error:', error);
    return Response.json({ error: 'Failed to fetch loan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    const { principal, interest_rate, term_months, start_date, status } = await request.json();
    
    if (!id) {
      return Response.json({ error: 'Missing loan id' }, { status: 400 });
    }

    // Validate data types
    const principalNum = parseFloat(principal);
    const interestRateNum = parseFloat(interest_rate);
    const termMonthsNum = parseInt(term_months);
    
    if (isNaN(principalNum) || isNaN(interestRateNum) || isNaN(termMonthsNum)) {
      return Response.json({ error: 'Invalid numeric values' }, { status: 400 });
    }

    const result = await query(
      'UPDATE loans SET principal = $1, interest_rate = $2, term_months = $3, start_date = $4, status = $5 WHERE id = $6 RETURNING *',
      [principalNum, interestRateNum, termMonthsNum, start_date, status || 'active', id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Loan not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('PUT loan error:', error);
    return Response.json({ error: 'Failed to update loan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    
    if (!id) {
      return Response.json({ error: 'Missing loan id' }, { status: 400 });
    }

    const result = await query('DELETE FROM loans WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Loan not found' }, { status: 404 });
    }

    return Response.json({ success: true, deletedLoan: result.rows[0] });
  } catch (error) {
    console.error('DELETE loan error:', error);
    return Response.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
} 