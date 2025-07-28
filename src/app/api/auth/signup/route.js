import pool from '../../db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, role = 'staff', department = 'operations' } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required.' }), { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
      [email, hashed, role, department]
    );
    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (err) {
    if (err.code === '23505') {
      return new Response(JSON.stringify({ error: 'Email already exists.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500 });
  }
} 