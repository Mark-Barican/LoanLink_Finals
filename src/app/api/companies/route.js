import pool from '../db';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

export async function GET() {
  const result = await pool.query('SELECT * FROM companies ORDER BY created_at DESC');
  return new Response(JSON.stringify(result.rows), { status: 200 });
}

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { name, industry, address, tin, contact_person } = await request.json();
  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing company name' }), { status: 400 });
  }
  const result = await pool.query(
    'INSERT INTO companies (name, industry, address, tin, contact_person) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, industry, address, tin, contact_person]
  );
  return new Response(JSON.stringify(result.rows[0]), { status: 201 });
}

export async function PUT(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id, name, industry, address, tin, contact_person } = await request.json();
  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }
  const result = await pool.query(
    'UPDATE companies SET name = $1, industry = $2, address = $3, tin = $4, contact_person = $5 WHERE id = $6 RETURNING *',
    [name, industry, address, tin, contact_person, id]
  );
  return new Response(JSON.stringify(result.rows[0]), { status: 200 });
}

export async function DELETE(request) {
  if (!isAdminOrManager(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing company id' }), { status: 400 });
  }
  await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 