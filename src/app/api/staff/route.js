import pool from '../db.js';
import bcrypt from 'bcryptjs';

function isAuthorized(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
}

function isAdmin(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin';
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden - Access required' }, { status: 403 });
    }
    
    const isAdminUser = isAdmin(request);
    
    // If admin, get all users. If manager, only get staff members
    const query = isAdminUser 
      ? 'SELECT id, email, role, department, created_at FROM users ORDER BY created_at DESC'
      : 'SELECT id, email, role, department, created_at FROM users WHERE role = $1 ORDER BY created_at DESC';
    
    const params = isAdminUser ? [] : ['staff'];
    const result = await pool.query(query, params);
    
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Staff GET error:', error);
    return Response.json({ error: 'Failed to load staff' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden - Access required' }, { status: 403 });
    }
    
    const isAdminUser = isAdmin(request);
    const { email: newEmail, password, role, department = 'operations' } = await request.json();
    
    if (!newEmail || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Managers can only create staff members
    if (!isAdminUser && role !== 'staff') {
      return Response.json({ error: 'Managers can only create staff members' }, { status: 403 });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const finalRole = isAdminUser ? role : 'staff';
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
      [newEmail, hashed, finalRole, department]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Staff POST error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden - Access required' }, { status: 403 });
    }
    
    const isAdminUser = isAdmin(request);
    const { id, email: newEmail, role, department } = await request.json();
    
    if (!id || !newEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Managers can only update staff members
    if (!isAdminUser) {
      // First check if the user being updated is a staff member
      const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      if (userCheck.rows[0].role !== 'staff') {
        return Response.json({ error: 'Managers can only update staff members' }, { status: 403 });
      }
      // Managers can only set role to staff
      if (role && role !== 'staff') {
        return Response.json({ error: 'Managers can only assign staff role' }, { status: 403 });
      }
    }
    
    const finalRole = isAdminUser ? role : 'staff';
    
    const result = await pool.query(
      'UPDATE users SET email = $1, role = $2, department = $3 WHERE id = $4 RETURNING id, email, role, department, created_at',
      [newEmail, finalRole, department || 'operations', id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Staff PUT error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Forbidden - Access required' }, { status: 403 });
    }
    
    const isAdminUser = isAdmin(request);
    const { id } = await request.json();
    
    if (!id) {
      return Response.json({ error: 'Missing user id' }, { status: 400 });
    }
    
    // Managers can only delete staff members
    if (!isAdminUser) {
      // First check if the user being deleted is a staff member
      const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      if (userCheck.rows[0].role !== 'staff') {
        return Response.json({ error: 'Managers can only delete staff members' }, { status: 403 });
      }
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Staff DELETE error:', error);
    return Response.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
} 