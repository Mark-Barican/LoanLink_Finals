import { query } from '../db.js';

function isAuthorized(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager' || role === 'staff';
}

const SELECT_COLUMNS = `
  r.*,
  l.code as loan_code, l.principal, l.interest_rate, l.term_months, l.status as loan_status,
  c.id as company_id, c.name as company_name, c.industry as company_industry,
  COALESCE(paid.total, 0)::numeric as amount_paid
`;

const FROM_JOINS = `
  FROM repayments r
  JOIN loans l ON r.loan_id = l.id
  JOIN companies c ON l.company_id = c.id
  LEFT JOIN (
    SELECT repayment_id, SUM(amount) AS total FROM payments GROUP BY repayment_id
  ) paid ON paid.repayment_id = r.id
`;

/** Flip a loan to completed once every repayment on it is settled. */
async function checkAndUpdateLoanStatus(loanId) {
  if (!loanId) return false;
  const check = await query(`
    SELECT
      COUNT(*) as total_repayments,
      COUNT(CASE WHEN status = 'paid' OR paid = true THEN 1 END) as paid_repayments
    FROM repayments
    WHERE loan_id = $1
  `, [loanId]);

  const { total_repayments, paid_repayments } = check.rows[0];
  const total = parseInt(total_repayments, 10);
  const paid = parseInt(paid_repayments, 10);

  if (total > 0 && total === paid) {
    await query("UPDATE loans SET status = 'completed' WHERE id = $1 AND status <> 'defaulted'", [loanId]);
    return true;
  }

  // Reopen a loan that was completed but has had a repayment reversed.
  await query("UPDATE loans SET status = 'active' WHERE id = $1 AND status = 'completed'", [loanId]);
  return false;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const loan_id = url.searchParams.get('loan_id');
    const company_id = url.searchParams.get('company_id');
    const status = url.searchParams.get('status');
    const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit')) || 10));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (company_id) {
      params.push(company_id);
      conditions.push(`l.company_id = $${params.length}`);
    }
    if (loan_id) {
      params.push(loan_id);
      conditions.push(`r.loan_id = $${params.length}`);
    }
    if (status === 'paid') {
      conditions.push("(r.status = 'paid' OR r.paid = true)");
    } else if (status === 'unpaid') {
      conditions.push("(r.status <> 'paid' AND r.paid = false)");
    } else if (status === 'overdue') {
      conditions.push("(r.status <> 'paid' AND r.paid = false AND r.due_date < CURRENT_DATE)");
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM repayments r JOIN loans l ON r.loan_id = l.id JOIN companies c ON l.company_id = c.id ${where}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].total, 10);

    const result = await query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} ${where}
       ORDER BY r.due_date
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return Response.json({
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('GET repayments error:', error);
    return Response.json({ error: 'Failed to fetch repayments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { loan_id, due_date, amount, status = 'unpaid' } = await request.json();
    if (!loan_id || !due_date || !amount) {
      return Response.json({ error: 'Loan, due date and amount are required' }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const isPaid = status === 'paid';
    const result = await query(
      'INSERT INTO repayments (loan_id, due_date, amount, status, paid, paid_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [loan_id, due_date, amountNum.toFixed(2), status, isPaid, isPaid ? new Date().toISOString() : null]
    );

    await checkAndUpdateLoanStatus(loan_id);

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST repayment error:', error);
    return Response.json({ error: 'Failed to create repayment' }, { status: 500 });
  }
}

/**
 * Partial update. Only the fields present in the body are written, so callers
 * that flip a status (the loan detail screen) do not blank out the due date
 * and amount, which are NOT NULL columns.
 */
export async function PUT(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return Response.json({ error: 'Missing repayment id' }, { status: 400 });
    }

    const existing = await query('SELECT id, loan_id, status FROM repayments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'Repayment not found' }, { status: 404 });
    }

    const sets = [];
    const params = [];

    if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '') {
      params.push(body.due_date);
      sets.push(`due_date = $${params.length}`);
    }

    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
      const amountNum = parseFloat(body.amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
      }
      params.push(amountNum.toFixed(2));
      sets.push(`amount = $${params.length}`);
    }

    if (body.status !== undefined && body.status !== null && body.status !== '') {
      const isPaid = body.status === 'paid';

      // Reversing a settled repayment would leave its payments dangling.
      if (!isPaid) {
        const linked = await query('SELECT COUNT(*)::int AS count FROM payments WHERE repayment_id = $1', [id]);
        if (linked.rows[0].count > 0) {
          return Response.json({
            error: 'This repayment has recorded payments. Delete those payments first to mark it unpaid.',
          }, { status: 409 });
        }
      }

      params.push(body.status);
      sets.push(`status = $${params.length}`);
      params.push(isPaid);
      sets.push(`paid = $${params.length}`);
      params.push(isPaid ? new Date().toISOString() : null);
      sets.push(`paid_at = $${params.length}`);
    }

    if (sets.length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    params.push(id);
    const result = await query(
      `UPDATE repayments SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    await checkAndUpdateLoanStatus(existing.rows[0].loan_id);

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('PUT repayment error:', error);
    return Response.json({ error: 'Failed to update repayment' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing repayment id' }, { status: 400 });
    }

    const existing = await query('SELECT loan_id FROM repayments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return Response.json({ error: 'Repayment not found' }, { status: 404 });
    }

    const linked = await query('SELECT COUNT(*)::int AS count FROM payments WHERE repayment_id = $1', [id]);
    if (linked.rows[0].count > 0) {
      return Response.json({
        error: 'This repayment has recorded payments. Delete those payments first.',
      }, { status: 409 });
    }

    await query('DELETE FROM repayments WHERE id = $1', [id]);
    await checkAndUpdateLoanStatus(existing.rows[0].loan_id);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE repayment error:', error);
    return Response.json({ error: 'Failed to delete repayment' }, { status: 500 });
  }
}
