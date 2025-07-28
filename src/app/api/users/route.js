import pool from '../db';

function isAdmin(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin';
}

export async function GET(request) {
  try {
    if (!isAdmin(request)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 });
    }
    
    const result = await pool.query('SELECT id, email, role, department, created_at FROM users ORDER BY created_at DESC');
    return new Response(JSON.stringify(result.rows), { status: 200 });
  } catch (error) {
    console.error('Users GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load users' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdmin(request)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 });
    }
    
    const { email: newEmail, password, role, department = 'operations' } = await request.json();
    if (!newEmail || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
      [newEmail, hashed, role, department]
    );
    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!isAdmin(request)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 });
    }
    
    const { id, email: newEmail, role, department } = await request.json();
    if (!id || !newEmail || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    const result = await pool.query(
      'UPDATE users SET email = $1, role = $2, department = $3 WHERE id = $4 RETURNING id, email, role, department, created_at',
      [newEmail, role, department || 'operations', id]
    );
    
    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (error) {
    console.error('Users PUT error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Failed to update user' }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAdmin(request)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 });
    }
    
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing user id' }), { status: 400 });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), { status: 500 });
  }
} 