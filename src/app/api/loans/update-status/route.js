import { query } from '../../db.js';

function isAdminOrManager(request) {
  const role = request.headers.get('x-user-role');
  return role === 'admin' || role === 'manager';
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

export async function POST(request) {
  if (!isAdminOrManager(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { loan_id } = await request.json();
    
    if (loan_id) {
      // Update specific loan
      const updated = await checkAndUpdateLoanStatus(loan_id);
      return Response.json({ 
        success: true, 
        message: updated ? 'Loan status updated to completed' : 'Loan not fully paid yet',
        updated 
      });
    } else {
      // Update all loans that should be completed
      const activeLoans = await query(`
        SELECT id FROM loans WHERE status = 'active'
      `);
      
      let updatedCount = 0;
      for (const loan of activeLoans.rows) {
        const updated = await checkAndUpdateLoanStatus(loan.id);
        if (updated) updatedCount++;
      }
      
      return Response.json({ 
        success: true, 
        message: `Updated ${updatedCount} loans to completed status`,
        updatedCount 
      });
    }
  } catch (error) {
    console.error('Update loan status error:', error);
    return Response.json({ 
      error: 'Failed to update loan status',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 