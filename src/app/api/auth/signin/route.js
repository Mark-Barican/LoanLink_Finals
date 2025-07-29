import { query } from '../../db.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt:', { email, password: password ? '***' : 'missing' });
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required.' }, { status: 400 });
    }

    // Define demo users with their correct passwords
    const demoUsers = {
      'mark_barican@example.com': { password: 'admin123', role: 'admin', department: 'operations' },
      'manager@example.com': { password: 'manager123', role: 'manager', department: 'operations' },
      'staff@example.com': { password: 'staff123', role: 'staff', department: 'operations' }
    };

    // Check if this is a demo user
    const isDemoUser = demoUsers[email];
    
    // First, check if user exists in our database
    let result = await query('SELECT id, email, password_hash, role, department, created_at FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // User doesn't exist, create them if they're a demo user
      if (isDemoUser) {
        console.log('Creating demo user:', email);
        const hashed = await bcrypt.hash(isDemoUser.password, 10);
        
        result = await query(
          'INSERT INTO users (email, password_hash, role, department) VALUES ($1, $2, $3, $4) RETURNING id, email, role, department, created_at',
          [email, hashed, isDemoUser.role, isDemoUser.department]
        );
      } else {
        return Response.json({ error: 'User not found.' }, { status: 401 });
      }
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role });
    
    // Verify password
    let valid = false;
    
    if (isDemoUser) {
      // For demo users, check against the known password
      valid = password === isDemoUser.password;
    } else {
      // For other users, check password hash
      valid = await bcrypt.compare(password, user.password_hash);
    }
    
    if (!valid) {
      console.log('Invalid password for user:', email);
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    console.log('Login successful for user:', email);
    
    // Exclude password_hash from response
    const { password_hash, ...userInfo } = user;
    return Response.json(userInfo);
  } catch (err) {
    console.error('Signin error:', err);
    return Response.json({ error: 'Server error.' }, { status: 500 });
  }
} 