import { query } from '../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        c.*,
        COUNT(CASE WHEN r.status = 'unpaid' THEN 1 END) AS payments_left,
        COALESCE(SUM(CASE WHEN r.status = 'unpaid' THEN r.amount ELSE 0 END), 0) AS unpaid_amount
      FROM companies c
      LEFT JOIN loans l ON c.id = l.company_id
      LEFT JOIN repayments r ON l.id = r.loan_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
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
    
    if (!name) {
      return Response.json({ error: 'Missing company name' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO companies (name, industry, address, tin, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, industry, address, tin, contact_person, phone, email]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST company error:', error);
    return Response.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

 