import { query } from '../../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

/** Philippine add-on interest, matching the calculation used when booking a loan. */
function addOn(principal, rate, months) {
  const totalInterest = parseFloat((principal * (rate / 100) * (months / 12)).toFixed(2));
  const totalAmount = parseFloat((principal + totalInterest).toFixed(2));
  const monthly = parseFloat((totalAmount / months).toFixed(2));
  return { totalInterest, totalAmount, monthly };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await query(`
      SELECT
        l.*,
        c.name AS company_name,
        c.industry AS company_industry,
        c.contact_person,
        c.email AS company_email,
        c.phone AS company_phone,
        u.email AS created_by_email
      FROM loans l
      LEFT JOIN companies c ON c.id = l.company_id
      LEFT JOIN users u ON u.id = l.created_by
      WHERE l.id = $1
    `, [id]);

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

    const { id } = await params;
    const { principal, interest_rate, term_months, start_date, status } = await request.json();

    if (!id) {
      return Response.json({ error: 'Missing loan id' }, { status: 400 });
    }

    const principalNum = parseFloat(principal);
    const interestRateNum = parseFloat(interest_rate);
    const termMonthsNum = parseInt(term_months);

    if (isNaN(principalNum) || isNaN(interestRateNum) || isNaN(termMonthsNum)) {
      return Response.json({ error: 'Invalid numeric values' }, { status: 400 });
    }

    if (principalNum <= 0) {
      return Response.json({ error: 'Principal must be greater than zero' }, { status: 400 });
    }

    if (termMonthsNum < 1 || termMonthsNum > 360) {
      return Response.json({ error: 'Term must be between 1 and 360 months' }, { status: 400 });
    }

    // Recompute the derived totals so they never drift away from the terms.
    const { totalInterest, totalAmount, monthly } = addOn(principalNum, interestRateNum, termMonthsNum);

    const result = await query(
      `UPDATE loans
         SET principal = $1, interest_rate = $2, term_months = $3, start_date = $4,
             status = $5, total_interest = $6, total_amount = $7
       WHERE id = $8
       RETURNING *`,
      [principalNum, interestRateNum, termMonthsNum, start_date, status || 'active', totalInterest, totalAmount, id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Loan not found' }, { status: 404 });
    }

    // The schedule is only safe to rebuild while nothing has been collected
    // against it. Once payments exist, rewriting rows would orphan them.
    const collected = await query(
      `SELECT COUNT(p.id)::int AS payment_count
         FROM repayments r
         LEFT JOIN payments p ON p.repayment_id = r.id
        WHERE r.loan_id = $1`,
      [id]
    );

    let scheduleRebuilt = false;
    if (collected.rows[0].payment_count === 0) {
      await query('DELETE FROM repayments WHERE loan_id = $1', [id]);
      const start = new Date(start_date);
      for (let i = 0; i < termMonthsNum; i += 1) {
        const due = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
        await query(
          'INSERT INTO repayments (loan_id, due_date, amount, status, paid) VALUES ($1, $2, $3, $4, $5)',
          [id, due, monthly, 'unpaid', false]
        );
      }
      scheduleRebuilt = true;
    }

    return Response.json({ ...result.rows[0], scheduleRebuilt });
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

    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Missing loan id' }, { status: 400 });
    }

    // Clear the dependent rows first; the foreign keys would otherwise block this.
    await query('BEGIN');
    try {
      await query(
        'DELETE FROM payments WHERE repayment_id IN (SELECT id FROM repayments WHERE loan_id = $1)',
        [id]
      );
      await query('DELETE FROM repayments WHERE loan_id = $1', [id]);
      const result = await query('DELETE FROM loans WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        await query('ROLLBACK');
        return Response.json({ error: 'Loan not found' }, { status: 404 });
      }

      await query('COMMIT');
      return Response.json({ success: true, deletedLoan: result.rows[0] });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('DELETE loan error:', error);
    return Response.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}
