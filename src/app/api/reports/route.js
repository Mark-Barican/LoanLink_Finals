import { query } from '../db.js';

export async function GET() {
  try {
    // Test database connection first
    try {
      await query('SELECT 1');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return Response.json({
        error: 'Database connection failed. Please check your DATABASE_URL environment variable.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : 'Connection error'
      }, { status: 500 });
    }

    // Get all data for statistics (with .catch for robustness)
    const [users, companies, loans, repayments, payments] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM companies').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM loans').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM repayments').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM payments').catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Get financial data - handle both old and new schema
    const [loanAmounts, repaidAmounts, paidRepayments, unpaidRepayments, totalRepaymentsQuery] = await Promise.all([
      query('SELECT COALESCE(SUM(principal), 0) as total FROM loans').catch(() => ({ rows: [{ total: 0 }] })),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM payments').catch(() => ({ rows: [{ total: 0 }] })),
      query('SELECT COUNT(*) as count FROM repayments WHERE status = $1 OR paid = $2', ['paid', true]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM repayments WHERE status = $1 OR paid = $2', ['unpaid', false]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM repayments').catch(() => ({ rows: [{ total: 0 }] }))
    ]);

    // Calculate additional stats with proper outstanding balance calculation
    const totalLoanAmount = parseFloat(loanAmounts.rows[0]?.total || 0);
    const totalRepaid = parseFloat(repaidAmounts.rows[0]?.total || 0);
    const totalRepaymentsAmount = parseFloat(totalRepaymentsQuery.rows[0]?.total || 0);
    
    // Outstanding balance: if overpaid (totalRepaid > totalLoanAmount), show positive amount
    // If underpaid (totalRepaid < totalLoanAmount), show negative amount
    const outstandingBalance = totalRepaid > totalLoanAmount 
      ? totalRepaid - totalLoanAmount  // Overpaid - show positive
      : totalLoanAmount - totalRepaid; // Underpaid - show positive
    
    const isOverpaid = totalRepaid > totalLoanAmount;
    const isUnderpaid = totalRepaid < totalLoanAmount;
    
    const totalRepaymentsCount = parseInt(repayments.rows[0]?.count || 0);
    const paymentRate = totalRepaymentsCount > 0
      ? Math.round((parseInt(paidRepayments.rows[0]?.count || 0) / totalRepaymentsCount) * 100)
      : 0;

    // Get recent activity (this month) - handle both old and new schema
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [recentLoans, recentPayments, overdueRepayments] = await Promise.all([
      query('SELECT COUNT(*) as count FROM loans WHERE EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2', [currentMonth, currentYear]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM payments WHERE EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) = $1 AND EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) = $2', [currentMonth, currentYear]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM repayments WHERE (status = $1 OR paid = $2) AND due_date < $3', ['unpaid', false, new Date().toISOString()]).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Get month-over-month changes for trend analysis
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const [previousMonthLoans, previousMonthPayments, previousMonthCompanies] = await Promise.all([
      query('SELECT COUNT(*) as count FROM loans WHERE EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2', [previousMonth, previousYear]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM payments WHERE EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) = $1 AND EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) = $2', [previousMonth, previousYear]).catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*) as count FROM companies WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2', [previousMonth, previousYear]).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Calculate trends
    const loansTrend = parseInt(recentLoans.rows[0]?.count || 0) - parseInt(previousMonthLoans.rows[0]?.count || 0);
    const paymentsTrend = parseInt(recentPayments.rows[0]?.count || 0) - parseInt(previousMonthPayments.rows[0]?.count || 0);
    const companiesTrend = parseInt(companies.rows[0]?.count || 0) - parseInt(previousMonthCompanies.rows[0]?.count || 0);

    // Get data for charts
    const [monthlyLoans, monthlyPayments, roleDistribution, departmentDistribution, paymentMethodsDistribution, companyLoanDistribution, repaymentStatusByMonth] = await Promise.all([
      // Monthly loans for the last 6 months
      query(`
        SELECT 
          EXTRACT(MONTH FROM start_date) as month,
          EXTRACT(YEAR FROM start_date) as year,
          COUNT(*) as count,
          COALESCE(SUM(principal), 0) as total_amount
        FROM loans 
        WHERE start_date >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM start_date), EXTRACT(YEAR FROM start_date)
        ORDER BY year, month
      `).catch(() => ({ rows: [] })),
      
      // Monthly payments for the last 6 months
      query(`
        SELECT 
          EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) as month,
          EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) as year,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM payments 
        WHERE COALESCE(payment_date, paid_at::date) >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)), EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date))
        ORDER BY year, month
      `).catch(() => ({ rows: [] })),
      
      // User role distribution
      query(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),
      
      // Department distribution
      query(`
        SELECT department, COUNT(*) as count
        FROM users
        GROUP BY department
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),
      
      // Payment methods distribution
      query(`
        SELECT 
          COALESCE(method, 'cash') as method,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM payments
        GROUP BY COALESCE(method, 'cash')
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),
      
      // Company loan distribution (top 10 companies by loan amount)
      query(`
        SELECT 
          c.name as company_name,
          COUNT(l.id) as loan_count,
          COALESCE(SUM(l.principal), 0) as total_loan_amount,
          COALESCE(SUM(CASE WHEN l.end_date IS NULL OR l.end_date > CURRENT_DATE THEN l.principal ELSE 0 END), 0) as active_loan_amount
        FROM companies c
        LEFT JOIN loans l ON c.id = l.company_id
        GROUP BY c.id, c.name
        HAVING COUNT(l.id) > 0
        ORDER BY total_loan_amount DESC
        LIMIT 10
      `).catch(() => ({ rows: [] })),
      
      // Repayment status by month (last 6 months)
      query(`
        SELECT 
          EXTRACT(MONTH FROM r.due_date) as month,
          EXTRACT(YEAR FROM r.due_date) as year,
          r.status,
          COUNT(*) as count,
          COALESCE(SUM(r.amount), 0) as total_amount
        FROM repayments r
        WHERE r.due_date >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM r.due_date), EXTRACT(YEAR FROM r.due_date), r.status
        ORDER BY year, month, r.status
      `).catch(() => ({ rows: [] }))
    ]);

    // Process chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const chartData = {
      monthlyLoans: monthlyLoans.rows.map(row => ({
        month: monthNames[parseInt(row.month) - 1],
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      })),
      monthlyPayments: monthlyPayments.rows.map(row => ({
        month: monthNames[parseInt(row.month) - 1],
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      })),
      roleDistribution: roleDistribution.rows.map(row => ({
        role: row.role,
        count: parseInt(row.count)
      })),
      departmentDistribution: departmentDistribution.rows.map(row => ({
        department: row.department,
        count: parseInt(row.count)
      })),
      paymentMethodsDistribution: paymentMethodsDistribution.rows.map(row => ({
        method: row.method,
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      })),
      companyLoanDistribution: companyLoanDistribution.rows.map(row => ({
        company: row.company_name,
        loanCount: parseInt(row.loan_count),
        totalAmount: parseFloat(row.total_loan_amount),
        activeAmount: parseFloat(row.active_loan_amount)
      })),
      repaymentStatusByMonth: repaymentStatusByMonth.rows.map(row => ({
        month: monthNames[parseInt(row.month) - 1],
        status: row.status,
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      }))
    };

    // Get additional detailed statistics
    const [averageLoanAmount, averageRepaymentAmount, topPerformingCompanies, overdueAmount] = await Promise.all([
      query('SELECT COALESCE(AVG(principal), 0) as avg_amount FROM loans').catch(() => ({ rows: [{ avg_amount: 0 }] })),
      query('SELECT COALESCE(AVG(amount), 0) as avg_amount FROM repayments').catch(() => ({ rows: [{ avg_amount: 0 }] })),
      query(`
        SELECT 
          c.name as company_name,
          COUNT(l.id) as loan_count,
          COALESCE(SUM(l.principal), 0) as total_borrowed,
          COALESCE(SUM(p.amount), 0) as total_paid,
          CASE 
            WHEN COALESCE(SUM(l.principal), 0) > 0 
            THEN ROUND((COALESCE(SUM(p.amount), 0) / COALESCE(SUM(l.principal), 0)) * 100, 2)
            ELSE 0 
          END as repayment_rate
        FROM companies c
        LEFT JOIN loans l ON c.id = l.company_id
        LEFT JOIN repayments r ON l.id = r.loan_id
        LEFT JOIN payments p ON r.id = p.repayment_id
        GROUP BY c.id, c.name
        HAVING COUNT(l.id) > 0
        ORDER BY repayment_rate DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),
      query(`
        SELECT COALESCE(SUM(r.amount), 0) as total_overdue
        FROM repayments r
        WHERE r.due_date < CURRENT_DATE AND (r.status = 'unpaid' OR r.paid = false)
      `).catch(() => ({ rows: [{ total_overdue: 0 }] }))
    ]);

    const stats = {
      users: parseInt(users.rows[0]?.count || 0),
      companies: parseInt(companies.rows[0]?.count || 0),
      activeLoans: parseInt(loans.rows[0]?.count || 0),
      totalRepayments: parseInt(repayments.rows[0]?.count || 0),
      totalLoanAmount: totalLoanAmount,
      totalRepaid: totalRepaid,
      outstandingBalance: outstandingBalance,
      isOverpaid: isOverpaid,
      isUnderpaid: isUnderpaid,
      paidRepayments: parseInt(paidRepayments.rows[0]?.count || 0),
      unpaidRepayments: parseInt(unpaidRepayments.rows[0]?.count || 0),
      paymentRate: paymentRate,
      recentLoans: parseInt(recentLoans.rows[0]?.count || 0),
      recentPayments: parseInt(recentPayments.rows[0]?.count || 0),
      overdueRepayments: parseInt(overdueRepayments.rows[0]?.count || 0),
      averageLoanAmount: parseFloat(averageLoanAmount.rows[0]?.avg_amount || 0),
      averageRepaymentAmount: parseFloat(averageRepaymentAmount.rows[0]?.avg_amount || 0),
      overdueAmount: parseFloat(overdueAmount.rows[0]?.total_overdue || 0),
      totalRepaymentsAmount: totalRepaymentsAmount,
      topPerformingCompanies: topPerformingCompanies.rows.map(row => ({
        company: row.company_name,
        loanCount: parseInt(row.loan_count),
        totalBorrowed: parseFloat(row.total_borrowed),
        totalPaid: parseFloat(row.total_paid),
        repaymentRate: parseFloat(row.repayment_rate)
      })),
      trends: {
        loans: loansTrend,
        payments: paymentsTrend,
        companies: companiesTrend
      },
      charts: chartData
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Reports API error:', error);
    return Response.json({ 
      error: 'Failed to load reports',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 