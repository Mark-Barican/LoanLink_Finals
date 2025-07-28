import pool from '../../db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required.' }), { status: 400 });
    }

    // First, check if user exists in our database
    let result = await pool.query('SELECT id, email, password_hash, role, department, created_at FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // User doesn't exist in our database, but might exist in Neon Auth
      // For now, let's create a default user with the email (you can set password later)
      // This is a temporary solution - you should sync users properly
      const defaultPassword = 'changeme123'; // Temporary password
      const hashed = await bcrypt.hash(defaultPassword, 10);
      
      // Determine role based on email
      let role = 'staff';
      let department = 'operations';
      
      if (email === 'mark_barican@example.com') {
        role = 'admin';
        department = 'operations';
      } else if (email === 'manager_demo@example.com') {
        role = 'manager';
        department = 'operations';
      } else if (email === 'staff_demo@example.com') {
        role = 'staff';
        department = 'operations';
      }
      
      // Insert the user
      result = await pool.query(
        'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
        [email, hashed, role, department]
      );
    }

    const user = result.rows[0];
    
    // For now, let's allow login with any password for these demo users
    // In production, you should properly sync passwords from Neon Auth
    let valid = false;
    
    if (email === 'mark_barican@example.com' && password === 'markpogi123') {
      valid = true;
    } else if (email === 'manager_demo@example.com' && password === 'manager123') {
      valid = true;
    } else if (email === 'staff_demo@example.com' && password === 'staff123') {
      valid = true;
    } else {
      // For other users, check password hash
      valid = await bcrypt.compare(password, user.password_hash);
    }
    
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials.' }), { status: 401 });
    }

    // Exclude password_hash from response
    const { password_hash, ...userInfo } = user;
    return new Response(JSON.stringify(userInfo), { status: 200 });
  } catch (err) {
    console.error('Signin error:', err);
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500 });
  }
} 