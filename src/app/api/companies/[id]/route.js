import { query } from '../../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await query('SELECT * FROM companies WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('GET company error:', error);
    return Response.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { name, industry, address, tin, contact_person, phone, email } = await request.json();

    if (!id || !name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      'UPDATE companies SET name = $1, industry = $2, address = $3, tin = $4, contact_person = $5, phone = $6, email = $7 WHERE id = $8 RETURNING *',
      [name, industry, address, tin, contact_person, phone, email, id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('PUT company error:', error);
    return Response.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!isAdminOrManager(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Missing company id' }, { status: 400 });
    }

    // Refuse rather than cascade: deleting a borrower with live loans would
    // silently take its repayment history with it.
    const loans = await query('SELECT COUNT(*)::int AS count FROM loans WHERE company_id = $1', [id]);
    if (loans.rows[0].count > 0) {
      return Response.json({
        error: `This company still has ${loans.rows[0].count} loan${loans.rows[0].count === 1 ? '' : 's'}. Delete or reassign them first.`,
      }, { status: 409 });
    }

    const result = await query('DELETE FROM companies WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    return Response.json({ success: true, deletedCompany: result.rows[0] });
  } catch (error) {
    console.error('DELETE company error:', error);
    return Response.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}
