import { query } from '../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

/**
 * Companies with their portfolio position. The aggregates come from separate
 * subqueries rather than a chain of LEFT JOINs, which would multiply rows
 * across loans and repayments and inflate every sum.
 */
export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.*,
        COALESCE(l.loan_count, 0)::int      AS loan_count,
        COALESCE(l.active_loans, 0)::int    AS active_loans,
        COALESCE(l.total_principal, 0)      AS total_principal,
        COALESCE(l.total_due, 0)            AS total_due,
        COALESCE(r.payments_left, 0)::int   AS payments_left,
        COALESCE(r.unpaid_amount, 0)        AS unpaid_amount,
        COALESCE(r.overdue_count, 0)::int   AS overdue_count,
        COALESCE(p.collected, 0)            AS collected
      FROM companies c
      LEFT JOIN (
        SELECT company_id,
               COUNT(*) AS loan_count,
               COUNT(*) FILTER (WHERE status = 'active') AS active_loans,
               COALESCE(SUM(principal), 0) AS total_principal,
               COALESCE(SUM(COALESCE(total_amount, principal)), 0) AS total_due
        FROM loans
        GROUP BY company_id
      ) l ON l.company_id = c.id
      LEFT JOIN (
        SELECT lo.company_id,
               COUNT(*) FILTER (WHERE re.status <> 'paid' AND re.paid = false) AS payments_left,
               COALESCE(SUM(re.amount) FILTER (WHERE re.status <> 'paid' AND re.paid = false), 0) AS unpaid_amount,
               COUNT(*) FILTER (WHERE re.status <> 'paid' AND re.paid = false AND re.due_date < CURRENT_DATE) AS overdue_count
        FROM repayments re
        JOIN loans lo ON lo.id = re.loan_id
        GROUP BY lo.company_id
      ) r ON r.company_id = c.id
      LEFT JOIN (
        SELECT lo.company_id, COALESCE(SUM(pa.amount), 0) AS collected
        FROM payments pa
        JOIN repayments re ON re.id = pa.repayment_id
        JOIN loans lo ON lo.id = re.loan_id
        GROUP BY lo.company_id
      ) p ON p.company_id = c.id
      ORDER BY c.name
    `);
    return Response.json(result.rows);
  } catch (error) {
    console.error('GET companies error:', error);
    return Response.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, industry, address, tin, contact_person, phone, email } = await request.json();

    if (!name || !name.trim()) {
      return Response.json({ error: 'Company name is required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO companies (name, industry, address, tin, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name.trim(), industry, address, tin, contact_person, phone, email]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST company error:', error);
    return Response.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
