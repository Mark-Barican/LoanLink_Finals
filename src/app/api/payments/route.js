import { query } from '../db.js';

function isAuthorized(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager' || role === 'staff';
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const repayment_id = url.searchParams.get('repayment_id');
    const company_id = url.searchParams.get('company_id');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;
    
    let result;
    let totalCount;
    
    if (company_id) {
      // Filter by company - join with repayments and loans to get company_id
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE l.company_id = $1
      `, [company_id]);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT p.*, r.amount as repayment_amount, r.due_date, r.status as repayment_status,
               l.code as loan_code, l.principal, l.interest_rate,
               c.name as company_name, c.industry as company_industry
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE l.company_id = $1
        ORDER BY p.payment_date DESC
        LIMIT $2 OFFSET $3
      `, [company_id, limit, offset]);
    } else if (repayment_id) {
      // Filter by specific repayment
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE p.repayment_id = $1
      `, [repayment_id]);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT p.*, r.amount as repayment_amount, r.due_date, r.status as repayment_status,
               l.code as loan_code, l.principal, l.interest_rate,
               c.name as company_name, c.industry as company_industry
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        WHERE p.repayment_id = $1
        ORDER BY p.payment_date DESC
        LIMIT $2 OFFSET $3
      `, [repayment_id, limit, offset]);
    } else {
      // Get all payments with detailed info
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
      `);
      totalCount = parseInt(countResult.rows[0].total);
      
      result = await query(`
        SELECT p.*, r.amount as repayment_amount, r.due_date, r.status as repayment_status,
               l.code as loan_code, l.principal, l.interest_rate,
               c.name as company_name, c.industry as company_industry
        FROM payments p
        JOIN repayments r ON p.repayment_id = r.id
        JOIN loans l ON r.loan_id = l.id
        JOIN companies c ON l.company_id = c.id
        ORDER BY p.payment_date DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    }
    
    // Transform the data to ensure consistent format
    const transformedRows = result.rows.map(row => ({
      ...row,
      payment_date: row.payment_date || (row.paid_at ? new Date(row.paid_at).toISOString().split('T')[0] : null),
      method: row.method || 'cash',
      paid_at: row.paid_at || null
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return Response.json({
      data: transformedRows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return Response.json({ error: 'Failed to load payments' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    
    // Check if this is a bulk payment or single payment
    if (body.payments && Array.isArray(body.payments)) {
      // Handle bulk payments
      return await handleBulkPayments(body.payments);
    } else {
      // Handle single payment
      return await handleSinglePayment(body);
    }
  } catch (error) {
    console.error('Payments POST error:', error);
    return Response.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// Function to check if a loan is fully paid and update its status
async function checkAndUpdateLoanStatus(loanId) {
  try {
    // Check if all repayments for this loan are paid
    const repaymentCheck = await query(`
      SELECT 
        COUNT(*) as total_repayments,
        COUNT(CASE WHEN status = 'paid' OR paid = true THEN 1 END) as paid_repayments
      FROM repayments 
      WHERE loan_id = $1
    `, [loanId]);
    
    const { total_repayments, paid_repayments } = repaymentCheck.rows[0];
    
    // If all repayments are paid, update loan status to 'completed'
    if (parseInt(total_repayments) > 0 && parseInt(total_repayments) === parseInt(paid_repayments)) {
      await query(
        'UPDATE loans SET status = $1 WHERE id = $2',
        ['completed', loanId]
      );
      console.log(`Loan ${loanId} status updated to 'completed' - all repayments paid`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking loan status:', error);
    return false;
  }
}

async function handleSinglePayment(paymentData) {
  const { repayment_id, amount, payment_date, method = 'cash' } = paymentData;
  
  // Ensure amount is properly formatted to 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  console.log('Creating single payment:', { repayment_id, amount: formattedAmount, payment_date, method });
  
  if (!repayment_id || !amount || !payment_date) {
    console.log('Missing required fields:', { repayment_id, amount, payment_date });
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  try {
    // Start a transaction
    await query('BEGIN');
    console.log('Transaction started');
    
    // Check if repayment exists and is unpaid
    const repaymentCheck = await query(
      'SELECT id, amount, status, loan_id FROM repayments WHERE id = $1',
      [repayment_id]
    );
    
    console.log('Repayment check result:', repaymentCheck.rows);
    
    if (repaymentCheck.rows.length === 0) {
      await query('ROLLBACK');
      console.log('Repayment not found, rolling back');
      return Response.json({ error: 'Repayment not found' }, { status: 404 });
    }
    
    const repayment = repaymentCheck.rows[0];
    if (repayment.status === 'paid') {
      await query('ROLLBACK');
      console.log('Repayment already paid, rolling back');
      return Response.json({ error: 'Repayment is already paid' }, { status: 400 });
    }
    
    // Insert the payment with paid_at set to current timestamp
    const paymentResult = await query(
      'INSERT INTO payments (repayment_id, amount, payment_date, method, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [repayment_id, formattedAmount, payment_date, method, new Date().toISOString()]
    );
    
    console.log('Payment inserted:', paymentResult.rows[0]);
    
    // Update the repayment status to 'paid'
    const updateResult = await query(
      'UPDATE repayments SET status = $1, paid = $2 WHERE id = $3 RETURNING *',
      ['paid', true, repayment_id]
    );
    
    console.log('Repayment updated:', updateResult.rows[0]);
    
    // Check if loan should be marked as completed
    await checkAndUpdateLoanStatus(repayment.loan_id);
    
    await query('COMMIT');
    console.log('Transaction committed successfully');
    
    return Response.json(paymentResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error in handleSinglePayment:', error);
    await query('ROLLBACK');
    throw error;
  }
}

async function handleBulkPayments(payments) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return Response.json({ error: 'Invalid payments data' }, { status: 400 });
  }
  
  try {
    // Start a transaction
    await query('BEGIN');
    
    const createdPayments = [];
    const updatedLoans = new Set(); // Track loans that need status check
    
    for (const payment of payments) {
      const { repayment_id, amount, payment_date, method = 'cash' } = payment;
      
      // Ensure amount is properly formatted to 2 decimal places
      const formattedAmount = parseFloat(amount).toFixed(2);
      
      if (!repayment_id || !amount || !payment_date) {
        await query('ROLLBACK');
        return Response.json({ error: 'Missing required fields in bulk payment' }, { status: 400 });
      }
      
      // Check if repayment exists and is unpaid
      const repaymentCheck = await query(
        'SELECT id, amount, status, loan_id FROM repayments WHERE id = $1',
        [repayment_id]
      );
      
      if (repaymentCheck.rows.length === 0) {
        await query('ROLLBACK');
        return Response.json({ error: `Repayment ${repayment_id} not found` }, { status: 404 });
      }
      
      const repayment = repaymentCheck.rows[0];
      if (repayment.status === 'paid') {
        await query('ROLLBACK');
        return Response.json({ error: `Repayment ${repayment_id} is already paid` }, { status: 400 });
      }
      
      // Insert the payment
      const paymentResult = await query(
        'INSERT INTO payments (repayment_id, amount, payment_date, method, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [repayment_id, formattedAmount, payment_date, method, new Date().toISOString()]
      );
      
      // Update the repayment status to 'paid'
      await query(
        'UPDATE repayments SET status = $1, paid = $2 WHERE id = $3',
        ['paid', true, repayment_id]
      );
      
      createdPayments.push(paymentResult.rows[0]);
      updatedLoans.add(repayment.loan_id); // Track this loan for status check
    }
    
    // Check and update loan status for all affected loans
    for (const loanId of updatedLoans) {
      await checkAndUpdateLoanStatus(loanId);
    }
    
    await query('COMMIT');
    
    return Response.json({ 
      success: true, 
      message: `Created ${createdPayments.length} payments`,
      payments: createdPayments 
    }, { status: 201 });
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

export async function PUT(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const { id, amount, payment_date, method } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing payment id' }, { status: 400 });
    }
    
    // Ensure amount is properly formatted to 2 decimal places
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    const result = await query(
      'UPDATE payments SET amount = $1, payment_date = $2, method = $3 WHERE id = $4 RETURNING *',
      [formattedAmount, payment_date, method, id]
    );
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Payments PUT error:', error);
    return Response.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const { id } = await request.json();
    if (!id) {
      return Response.json({ error: 'Missing payment id' }, { status: 400 });
    }
    
    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // Get the repayment_id before deleting the payment
      const paymentResult = await query('SELECT repayment_id FROM payments WHERE id = $1', [id]);
      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const repayment_id = paymentResult.rows[0].repayment_id;
      
      // Delete the payment
      await query('DELETE FROM payments WHERE id = $1', [id]);
      
      // Update the repayment status back to 'unpaid'
      await query(
        'UPDATE repayments SET status = $1, paid = $2 WHERE id = $3',
        ['unpaid', false, repayment_id]
      );
      
      await query('COMMIT');
      
      return Response.json({ success: true });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Payments DELETE error:', error);
    return Response.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
} 