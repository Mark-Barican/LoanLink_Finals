import { query } from '../db.js';

function isAuthorized(request) {
  const userRole = request.headers.get('x-user-role');
  return userRole === 'admin' || userRole === 'manager' || userRole === 'staff';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Trailing window for the time-series charts. Anything else falls back to 6. */
const ALLOWED_WINDOWS = [1, 3, 6, 12];

const safe = (fallback) => () => ({ rows: fallback });

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await query('SELECT 1');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return Response.json({
        error: 'Database connection failed. Check the DATABASE_URL environment variable.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : 'Connection error'
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const requestedWindow = parseInt(url.searchParams.get('months'), 10);
    const windowMonths = ALLOWED_WINDOWS.includes(requestedWindow) ? requestedWindow : 6;
    // Interpolated rather than parameterised: Postgres will not take a bind
    // parameter inside an interval literal, and the value is clamped above.
    const windowInterval = `${windowMonths} months`;

    const [users, companies, loans, repayments, payments, activeLoans] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users').catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM companies').catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM loans').catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM repayments').catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM payments').catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM loans WHERE status = $1', ['active']).catch(safe([{ count: 0 }]))
    ]);

    const [loanAmounts, totalInterestAmounts, totalAmounts, repaidAmounts, paidRepayments, unpaidRepayments, totalRepaymentsQuery] = await Promise.all([
      query('SELECT COALESCE(SUM(principal), 0) as total FROM loans').catch(safe([{ total: 0 }])),
      query('SELECT COALESCE(SUM(total_interest), 0) as total FROM loans').catch(safe([{ total: 0 }])),
      query('SELECT COALESCE(SUM(total_amount), 0) as total FROM loans').catch(safe([{ total: 0 }])),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM payments').catch(safe([{ total: 0 }])),
      query("SELECT COUNT(*) as count FROM repayments WHERE status = 'paid' OR paid = true").catch(safe([{ count: 0 }])),
      query("SELECT COUNT(*) as count FROM repayments WHERE status <> 'paid' AND paid = false").catch(safe([{ count: 0 }])),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM repayments').catch(safe([{ total: 0 }]))
    ]);

    const totalLoanAmount = parseFloat(loanAmounts.rows[0]?.total || 0);
    const totalInterestAmount = parseFloat(totalInterestAmounts.rows[0]?.total || 0);
    const totalAmountToRepay = parseFloat(totalAmounts.rows[0]?.total || 0);
    const totalRepaid = parseFloat(repaidAmounts.rows[0]?.total || 0);
    const totalRepaymentsAmount = parseFloat(totalRepaymentsQuery.rows[0]?.total || 0);

    // Outstanding is measured against the full amount due (principal plus
    // add-on interest), which is what the borrower actually owes.
    const dueTotal = totalAmountToRepay || totalLoanAmount;
    const isOverpaid = totalRepaid > dueTotal;
    const outstandingBalance = Math.abs(dueTotal - totalRepaid);

    const totalRepaymentsCount = parseInt(repayments.rows[0]?.count || 0);
    const paymentRate = totalRepaymentsCount > 0
      ? Math.round((parseInt(paidRepayments.rows[0]?.count || 0) / totalRepaymentsCount) * 100)
      : 0;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [recentLoans, recentPayments, overdueRepayments] = await Promise.all([
      query('SELECT COUNT(*) as count FROM loans WHERE EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2', [currentMonth, currentYear]).catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM payments WHERE EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) = $1 AND EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) = $2', [currentMonth, currentYear]).catch(safe([{ count: 0 }])),
      query("SELECT COUNT(*) as count FROM repayments WHERE status <> 'paid' AND paid = false AND due_date < CURRENT_DATE").catch(safe([{ count: 0 }]))
    ]);

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [previousMonthLoans, previousMonthPayments, previousMonthCompanies] = await Promise.all([
      query('SELECT COUNT(*) as count FROM loans WHERE EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2', [previousMonth, previousYear]).catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM payments WHERE EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) = $1 AND EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) = $2', [previousMonth, previousYear]).catch(safe([{ count: 0 }])),
      query('SELECT COUNT(*) as count FROM companies WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2', [previousMonth, previousYear]).catch(safe([{ count: 0 }]))
    ]);

    const currentMonthCompanies = await query(
      'SELECT COUNT(*) as count FROM companies WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2',
      [currentMonth, currentYear]
    ).catch(safe([{ count: 0 }]));

    const loansTrend = parseInt(recentLoans.rows[0]?.count || 0) - parseInt(previousMonthLoans.rows[0]?.count || 0);
    const paymentsTrend = parseInt(recentPayments.rows[0]?.count || 0) - parseInt(previousMonthPayments.rows[0]?.count || 0);
    const companiesTrend = parseInt(currentMonthCompanies.rows[0]?.count || 0) - parseInt(previousMonthCompanies.rows[0]?.count || 0);

    const [monthlyLoans, monthlyPayments, roleDistribution, departmentDistribution, paymentMethodsDistribution, companyLoanDistribution, repaymentStatusByMonth] = await Promise.all([
      query(`
        SELECT
          EXTRACT(MONTH FROM start_date) as month,
          EXTRACT(YEAR FROM start_date) as year,
          COUNT(*) as count,
          COALESCE(SUM(principal), 0) as total_amount
        FROM loans
        WHERE start_date >= NOW() - INTERVAL '${windowInterval}'
        GROUP BY EXTRACT(MONTH FROM start_date), EXTRACT(YEAR FROM start_date)
        ORDER BY year, month
      `).catch(safe([])),

      query(`
        SELECT
          EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)) as month,
          EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date)) as year,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM payments
        WHERE COALESCE(payment_date, paid_at::date) >= NOW() - INTERVAL '${windowInterval}'
        GROUP BY EXTRACT(MONTH FROM COALESCE(payment_date, paid_at::date)), EXTRACT(YEAR FROM COALESCE(payment_date, paid_at::date))
        ORDER BY year, month
      `).catch(safe([])),

      query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC').catch(safe([])),

      query('SELECT department, COUNT(*) as count FROM users GROUP BY department ORDER BY count DESC').catch(safe([])),

      query(`
        SELECT
          COALESCE(method, 'cash') as method,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM payments
        GROUP BY COALESCE(method, 'cash')
        ORDER BY count DESC
      `).catch(safe([])),

      query(`
        SELECT
          c.name as company_name,
          COUNT(l.id) as loan_count,
          COALESCE(SUM(l.principal), 0) as total_loan_amount,
          COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.principal ELSE 0 END), 0) as active_loan_amount
        FROM companies c
        LEFT JOIN loans l ON c.id = l.company_id
        GROUP BY c.id, c.name
        HAVING COUNT(l.id) > 0
        ORDER BY total_loan_amount DESC
        LIMIT 10
      `).catch(safe([])),

      query(`
        SELECT
          EXTRACT(MONTH FROM r.due_date) as month,
          EXTRACT(YEAR FROM r.due_date) as year,
          r.status,
          COUNT(*) as count,
          COALESCE(SUM(r.amount), 0) as total_amount
        FROM repayments r
        WHERE r.due_date >= NOW() - INTERVAL '${windowInterval}'
        GROUP BY EXTRACT(MONTH FROM r.due_date), EXTRACT(YEAR FROM r.due_date), r.status
        ORDER BY year, month, r.status
      `).catch(safe([]))
    ]);

    const chartData = {
      monthlyLoans: monthlyLoans.rows.map(row => ({
        month: MONTH_NAMES[parseInt(row.month) - 1],
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      })),
      monthlyPayments: monthlyPayments.rows.map(row => ({
        month: MONTH_NAMES[parseInt(row.month) - 1],
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
        month: MONTH_NAMES[parseInt(row.month) - 1],
        status: row.status,
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount)
      }))
    };

    const [averageLoanAmount, averageRepaymentAmount, topPerformingCompanies, overdueAmount] = await Promise.all([
      query('SELECT COALESCE(AVG(principal), 0) as avg_amount FROM loans').catch(safe([{ avg_amount: 0 }])),
      query('SELECT COALESCE(AVG(amount), 0) as avg_amount FROM repayments').catch(safe([{ avg_amount: 0 }])),
      query(`
        SELECT
          c.name as company_name,
          loan_totals.loan_count,
          loan_totals.total_principal,
          loan_totals.total_interest,
          COALESCE(paid_totals.total_paid, 0) as total_paid,
          CASE
            WHEN (loan_totals.total_principal + loan_totals.total_interest) > 0
            THEN ROUND((COALESCE(paid_totals.total_paid, 0) / (loan_totals.total_principal + loan_totals.total_interest)) * 100, 2)
            ELSE 0
          END as repayment_rate
        FROM companies c
        JOIN (
          SELECT
            company_id,
            COUNT(*) as loan_count,
            COALESCE(SUM(principal), 0) as total_principal,
            COALESCE(SUM(total_interest), 0) as total_interest
          FROM loans
          GROUP BY company_id
        ) loan_totals ON loan_totals.company_id = c.id
        LEFT JOIN (
          SELECT l.company_id, COALESCE(SUM(p.amount), 0) as total_paid
          FROM loans l
          JOIN repayments r ON r.loan_id = l.id
          JOIN payments p ON p.repayment_id = r.id
          GROUP BY l.company_id
        ) paid_totals ON paid_totals.company_id = c.id
        ORDER BY repayment_rate DESC
        LIMIT 5
      `).catch(safe([])),
      query(`
        SELECT COALESCE(SUM(r.amount), 0) as total_overdue
        FROM repayments r
        WHERE r.due_date < CURRENT_DATE AND r.status <> 'paid' AND r.paid = false
      `).catch(safe([{ total_overdue: 0 }]))
    ]);

    // A real activity feed. The dashboards used to show a hardcoded list here.
    const activity = await query(`
      (
        SELECT 'loan' AS kind, l.created_at AS at, l.code AS reference,
               c.name AS subject, l.principal AS amount
        FROM loans l LEFT JOIN companies c ON c.id = l.company_id
        ORDER BY l.created_at DESC LIMIT 8
      )
      UNION ALL
      (
        SELECT 'payment' AS kind, COALESCE(p.paid_at, p.created_at) AS at, l.code AS reference,
               c.name AS subject, p.amount AS amount
        FROM payments p
        JOIN repayments r ON r.id = p.repayment_id
        JOIN loans l ON l.id = r.loan_id
        LEFT JOIN companies c ON c.id = l.company_id
        ORDER BY COALESCE(p.paid_at, p.created_at) DESC LIMIT 8
      )
      UNION ALL
      (
        SELECT 'company' AS kind, c.created_at AS at, c.industry AS reference,
               c.name AS subject, NULL::numeric AS amount
        FROM companies c
        ORDER BY c.created_at DESC LIMIT 8
      )
      ORDER BY at DESC NULLS LAST
      LIMIT 10
    `).catch(safe([]));

    const stats = {
      windowMonths,
      users: parseInt(users.rows[0]?.count || 0),
      companies: parseInt(companies.rows[0]?.count || 0),
      totalLoans: parseInt(loans.rows[0]?.count || 0),
      activeLoans: parseInt(activeLoans.rows[0]?.count || 0),
      totalPayments: parseInt(payments.rows[0]?.count || 0),
      totalRepayments: totalRepaymentsCount,
      totalLoanAmount,
      totalInterestAmount,
      totalAmountToRepay,
      totalRepaid,
      outstandingBalance,
      isOverpaid,
      isUnderpaid: totalRepaid < dueTotal,
      paidRepayments: parseInt(paidRepayments.rows[0]?.count || 0),
      unpaidRepayments: parseInt(unpaidRepayments.rows[0]?.count || 0),
      paymentRate,
      recentLoans: parseInt(recentLoans.rows[0]?.count || 0),
      recentPayments: parseInt(recentPayments.rows[0]?.count || 0),
      recentCompanies: parseInt(currentMonthCompanies.rows[0]?.count || 0),
      overdueRepayments: parseInt(overdueRepayments.rows[0]?.count || 0),
      averageLoanAmount: parseFloat(averageLoanAmount.rows[0]?.avg_amount || 0),
      averageRepaymentAmount: parseFloat(averageRepaymentAmount.rows[0]?.avg_amount || 0),
      overdueAmount: parseFloat(overdueAmount.rows[0]?.total_overdue || 0),
      totalRepaymentsAmount,
      topPerformingCompanies: topPerformingCompanies.rows.map(row => ({
        company: row.company_name,
        loanCount: parseInt(row.loan_count),
        totalPrincipal: parseFloat(row.total_principal),
        totalInterest: parseFloat(row.total_interest),
        totalPaid: parseFloat(row.total_paid),
        repaymentRate: parseFloat(row.repayment_rate)
      })),
      activity: activity.rows.map(row => ({
        kind: row.kind,
        at: row.at,
        reference: row.reference,
        subject: row.subject,
        amount: row.amount === null ? null : parseFloat(row.amount)
      })),
      trends: {
        loans: loansTrend,
        payments: paymentsTrend,
        companies: companiesTrend
      },
      charts: chartData,
      lastUpdated: new Date().toISOString()
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
