import { query, withTransaction } from '../db.js';

function isAuthorized(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager' || role === 'staff';
}

const SELECT_COLUMNS = `
  p.*,
  r.amount as repayment_amount, r.due_date, r.status as repayment_status,
  l.id as loan_id, l.code as loan_code, l.principal, l.interest_rate,
  c.id as company_id, c.name as company_name, c.industry as company_industry
`;

const FROM_JOINS = `
  FROM payments p
  JOIN repayments r ON p.repayment_id = r.id
  JOIN loans l ON r.loan_id = l.id
  JOIN companies c ON l.company_id = c.id
`;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const repayment_id = url.searchParams.get('repayment_id');
    const company_id = url.searchParams.get('company_id');
    const loan_id = url.searchParams.get('loan_id');
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
    if (repayment_id) {
      params.push(repayment_id);
      conditions.push(`p.repayment_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total ${FROM_JOINS} ${where}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].total, 10);

    const result = await query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} ${where}
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const transformedRows = result.rows.map(row => ({
      ...row,
      payment_date: row.payment_date || (row.paid_at ? new Date(row.paid_at).toISOString().split('T')[0] : null),
      method: row.method || 'cash',
      paid_at: row.paid_at || null
    }));

    // Totals across the whole filtered set, not only the page on screen.
    const totalsResult = await query(
      `SELECT COALESCE(SUM(p.amount), 0) as total_amount, COALESCE(AVG(p.amount), 0) as average_amount ${FROM_JOINS} ${where}`,
      params
    );

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return Response.json({
      data: transformedRows,
      totals: {
        totalAmount: parseFloat(totalsResult.rows[0].total_amount),
        averageAmount: parseFloat(totalsResult.rows[0].average_amount)
      },
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
    console.error('Payments GET error:', error);
    return Response.json({ error: 'Failed to load payments' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.payments && Array.isArray(body.payments)) {
      return await handleBulkPayments(body.payments);
    }
    return await handleSinglePayment(body);
  } catch (error) {
    console.error('Payments POST error:', error);
    return Response.json({ error: error.message || 'Failed to create payment' }, { status: 500 });
  }
}

/** Settle the loan once every repayment on it is paid, using the caller's client. */
async function syncLoanStatus(run, loanId) {
  const check = await run(`
    SELECT
      COUNT(*) as total_repayments,
      COUNT(CASE WHEN status = 'paid' OR paid = true THEN 1 END) as paid_repayments
    FROM repayments
    WHERE loan_id = $1
  `, [loanId]);

  const total = parseInt(check.rows[0].total_repayments, 10);
  const paid = parseInt(check.rows[0].paid_repayments, 10);

  if (total > 0 && total === paid) {
    await run("UPDATE loans SET status = 'completed' WHERE id = $1 AND status <> 'defaulted'", [loanId]);
    return true;
  }
  await run("UPDATE loans SET status = 'active' WHERE id = $1 AND status = 'completed'", [loanId]);
  return false;
}

async function handleSinglePayment(paymentData) {
  const { repayment_id, amount, payment_date, method = 'cash' } = paymentData;

  if (!repayment_id || amount === undefined || amount === null || amount === '' || !payment_date) {
    return Response.json({ error: 'Repayment, amount and payment date are required' }, { status: 400 });
  }

  const amountNum = parseFloat(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (run) => {
      const repaymentCheck = await run(
        'SELECT id, amount, status, paid, loan_id FROM repayments WHERE id = $1 FOR UPDATE',
        [repayment_id]
      );

      if (repaymentCheck.rows.length === 0) {
        throw Object.assign(new Error('Repayment not found'), { status: 404 });
      }

      const repayment = repaymentCheck.rows[0];
      if (repayment.status === 'paid' || repayment.paid === true) {
        throw Object.assign(new Error('That repayment is already settled'), { status: 400 });
      }

      const payment = await run(
        'INSERT INTO payments (repayment_id, amount, payment_date, method, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [repayment_id, amountNum.toFixed(2), payment_date, method, new Date().toISOString()]
      );

      await run(
        'UPDATE repayments SET status = $1, paid = $2, paid_at = $3 WHERE id = $4',
        ['paid', true, new Date().toISOString(), repayment_id]
      );

      await syncLoanStatus(run, repayment.loan_id);

      return payment.rows[0];
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error('Single payment error:', error.message);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}

async function handleBulkPayments(payments) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return Response.json({ error: 'No repayments to settle' }, { status: 400 });
  }

  try {
    const created = await withTransaction(async (run) => {
      const rows = [];
      const touchedLoans = new Set();

      for (const payment of payments) {
        const { repayment_id, amount, payment_date, method = 'cash' } = payment;

        if (!repayment_id || amount === undefined || amount === null || !payment_date) {
          throw Object.assign(new Error('Every payment needs a repayment, amount and date'), { status: 400 });
        }

        const amountNum = parseFloat(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
          throw Object.assign(new Error('Amounts must be greater than zero'), { status: 400 });
        }

        const check = await run(
          'SELECT id, amount, status, paid, loan_id FROM repayments WHERE id = $1 FOR UPDATE',
          [repayment_id]
        );

        if (check.rows.length === 0) {
          throw Object.assign(new Error('One of the repayments no longer exists'), { status: 404 });
        }

        const repayment = check.rows[0];
        if (repayment.status === 'paid' || repayment.paid === true) {
          throw Object.assign(new Error('One of the repayments is already settled'), { status: 400 });
        }

        const inserted = await run(
          'INSERT INTO payments (repayment_id, amount, payment_date, method, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [repayment_id, amountNum.toFixed(2), payment_date, method, new Date().toISOString()]
        );

        await run(
          'UPDATE repayments SET status = $1, paid = $2, paid_at = $3 WHERE id = $4',
          ['paid', true, new Date().toISOString(), repayment_id]
        );

        rows.push(inserted.rows[0]);
        touchedLoans.add(repayment.loan_id);
      }

      for (const loanId of touchedLoans) {
        await syncLoanStatus(run, loanId);
      }

      return rows;
    });

    return Response.json({
      success: true,
      message: `Recorded ${created.length} payment${created.length === 1 ? '' : 's'}`,
      payments: created
    }, { status: 201 });
  } catch (error) {
    console.error('Bulk payment error:', error.message);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id, amount, payment_date, method } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing payment id' }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (!payment_date) {
      return Response.json({ error: 'Payment date is required' }, { status: 400 });
    }

    const result = await query(
      'UPDATE payments SET amount = $1, payment_date = $2, method = $3 WHERE id = $4 RETURNING *',
      [amountNum.toFixed(2), payment_date, method || 'cash', id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Payments PUT error:', error);
    return Response.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing payment id' }, { status: 400 });
    }

    await withTransaction(async (run) => {
      const found = await run('SELECT repayment_id FROM payments WHERE id = $1', [id]);
      if (found.rows.length === 0) {
        throw Object.assign(new Error('Payment not found'), { status: 404 });
      }

      const repaymentId = found.rows[0].repayment_id;
      await run('DELETE FROM payments WHERE id = $1', [id]);

      // Only reopen the repayment when nothing is left against it.
      const remaining = await run(
        'SELECT COUNT(*)::int AS count FROM payments WHERE repayment_id = $1',
        [repaymentId]
      );

      if (remaining.rows[0].count === 0) {
        await run(
          'UPDATE repayments SET status = $1, paid = $2, paid_at = NULL WHERE id = $3',
          ['unpaid', false, repaymentId]
        );
      }

      const loan = await run('SELECT loan_id FROM repayments WHERE id = $1', [repaymentId]);
      if (loan.rows.length > 0) {
        await syncLoanStatus(run, loan.rows[0].loan_id);
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Payments DELETE error:', error.message);
    return Response.json({ error: error.message || 'Failed to delete payment' }, { status: error.status || 500 });
  }
}
