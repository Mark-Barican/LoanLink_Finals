"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const router = useRouter();

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/reports", {
        cache: 'no-store' // Ensure fresh data
      });
      if (!res.ok) {
        throw new Error('Failed to load stats');
      }
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Fetch stats error:', e);
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!userData || userData.role !== "manager") {
      router.replace("/auth");
      return;
    }
    setUser(userData);
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [router]);

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercentage(value, total) {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  }

  function getTrendText(value, type) {
    if (!stats?.trends) return "No data";
    
    let trendValue = 0;
    switch (type) {
      case 'loans':
        trendValue = stats.trends.loans;
        break;
      case 'payments':
        trendValue = stats.trends.payments;
        break;
      case 'companies':
        trendValue = stats.trends.companies;
        break;
      default:
        trendValue = value;
    }
    
    if (trendValue === 0) return "No change";
    if (trendValue > 0) return `+${trendValue} this month`;
    return `${trendValue} this month`;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 pt-20">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 mb-1">Manager Dashboard</h1>
            <p className="text-white/60 text-sm">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white/60 text-xs">Last updated</div>
              <div className="text-white text-sm">{lastUpdated.toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={fetchStats}
              disabled={loading}
              className="bg-blue-400 hover:bg-blue-300 disabled:bg-blue-400/50 text-slate-900 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/60">Loading dashboard data...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Key Metrics - Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Users"
                value={stats.users}
                icon="👥"
                color="blue"
                trend={getTrendText(stats.users, 'users')}
              />
              <MetricCard
                title="Active Companies"
                value={stats.companies}
                icon="🏢"
                color="purple"
                trend={getTrendText(stats.companies, 'companies')}
              />
              <MetricCard
                title="Active Loans"
                value={stats.activeLoans}
                icon="💰"
                color="green"
                trend={getTrendText(stats.activeLoans, 'loans')}
              />
              <MetricCard
                title="Payment Rate"
                value={`${stats.paymentRate}%`}
                icon="📈"
                color="orange"
                trend={getTrendText(stats.paymentRate, 'payments')}
              />
            </div>

            {/* Financial Overview - Large Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FinancialCard
                title="Total Loan Portfolio"
                value={formatCurrency(stats.totalLoanAmount)}
                subtitle={`${stats.activeLoans} active loans`}
                icon="🏦"
                color="green"
                trend={getTrendText(stats.totalLoanAmount, 'loans')}
              />
              <FinancialCard
                title="Total Repaid"
                value={formatCurrency(stats.totalRepaid)}
                subtitle={`${stats.paidRepayments} payments received`}
                icon="✅"
                color="blue"
                trend={formatPercentage(stats.totalRepaid, stats.totalLoanAmount)}
              />
              <FinancialCard
                title="Outstanding Balance"
                value={formatCurrency(stats.outstandingBalance)}
                subtitle={`${stats.unpaidRepayments} pending repayments`}
                icon="⚠️"
                color={stats.outstandingBalance > 0 ? "red" : "gray"}
                trend={getTrendText(stats.outstandingBalance, 'loans')}
              />
            </div>

            {/* Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  📊 Recent Activity
                </h3>
                <div className="space-y-3">
                  <ActivityItem
                    icon="📝"
                    title="New Loans"
                    value={stats.recentLoans}
                    period="this month"
                    color="green"
                  />
                  <ActivityItem
                    icon="💳"
                    title="Payments Received"
                    value={stats.recentPayments}
                    period="this month"
                    color="blue"
                  />
                  <ActivityItem
                    icon="⏰"
                    title="Overdue Repayments"
                    value={stats.overdueRepayments}
                    period="currently"
                    color="red"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  ⚡ Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton
                    title="View Loans"
                    icon="💰"
                    href="/admin/loans"
                    color="green"
                  />
                  <QuickActionButton
                    title="View Companies"
                    icon="🏢"
                    href="/admin/companies"
                    color="blue"
                  />
                  <QuickActionButton
                    title="View Reports"
                    icon="📊"
                    href="/admin/reports"
                    color="purple"
                  />
                  <QuickActionButton
                    title="View Payments"
                    icon="💳"
                    href="/admin/payments"
                    color="orange"
                  />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                🔧 System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusItem
                  title="Database Connection"
                  status="Connected"
                  color="green"
                />
                <StatusItem
                  title="API Status"
                  status="Online"
                  color="green"
                />
                <StatusItem
                  title="Auto Refresh"
                  status="Every 30s"
                  color="blue"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/60 text-lg">No data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }) {
  const colors = {
    green: "border-green-500/30 bg-green-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    red: "border-red-500/30 bg-red-500/10",
    gray: "border-gray-500/30 bg-gray-500/10"
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-4 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-white/60">{trend}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60">{title}</div>
    </div>
  );
}

function FinancialCard({ title, value, subtitle, icon, color, trend }) {
  const colors = {
    green: "border-green-500/30 bg-green-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    red: "border-red-500/30 bg-red-500/10",
    gray: "border-gray-500/30 bg-gray-500/10"
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-xs text-white/60">{trend}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-lg font-semibold text-white mb-1">{title}</div>
      <div className="text-sm text-white/60">{subtitle}</div>
    </div>
  );
}

function ActivityItem({ icon, title, value, period, color }) {
  const colors = {
    green: "text-green-400",
    blue: "text-blue-400",
    red: "text-red-400",
    orange: "text-orange-400"
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-white font-medium">{title}</div>
          <div className="text-white/60 text-sm">{period}</div>
        </div>
      </div>
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
}

function QuickActionButton({ title, icon, href, color }) {
  const colors = {
    green: "bg-green-500 hover:bg-green-400 text-white",
    blue: "bg-blue-500 hover:bg-blue-400 text-white",
    purple: "bg-purple-500 hover:bg-purple-400 text-white",
    orange: "bg-orange-500 hover:bg-orange-400 text-white"
  };

  return (
    <Link
      href={href}
      className={`${colors[color]} rounded-lg p-4 text-center transition-colors duration-200 flex flex-col items-center space-y-2`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}

function StatusItem({ title, status, color }) {
  const colors = {
    green: "text-green-400",
    blue: "text-blue-400",
    red: "text-red-400",
    orange: "text-orange-400"
  };

  return (
    <div className="text-center p-3 bg-white/5 rounded-lg">
      <div className="text-white/60 text-sm mb-1">{title}</div>
      <div className={`font-semibold ${colors[color]}`}>{status}</div>
    </div>
  );
} 