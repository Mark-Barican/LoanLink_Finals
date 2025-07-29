import pool from '../db.js';
import bcrypt from 'bcryptjs';

function isAdmin(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin';
}

export async function GET(request) {
  try {
    if (!isAdmin(request)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const result = await pool.query('SELECT id, email, role, department, created_at FROM users ORDER BY created_at DESC');
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Users GET error:', error);
    return Response.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdmin(request)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { email: newEmail, password, role, department = 'operations' } = await request.json();
    if (!newEmail || !password || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
      [newEmail, hashed, role, department]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!isAdmin(request)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { id, email: newEmail, role, department } = await request.json();
    if (!id || !newEmail || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const result = await pool.query(
      'UPDATE users SET email = $1, role = $2, department = $3 WHERE id = $4 RETURNING id, email, role, department, created_at',
      [newEmail, role, department || 'operations', id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Users PUT error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAdmin(request)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { id } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing user id' }, { status: 400 });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return Response.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 