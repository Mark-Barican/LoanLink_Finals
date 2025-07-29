"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
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
    if (!userData) {
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
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
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
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-400 mb-1">Admin Dashboard</h1>
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
              className="bg-green-400 hover:bg-green-300 disabled:bg-green-400/50 text-slate-900 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
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
                icon="users"
                color="blue"
                trend={getTrendText(stats.users, 'users')}
              />
              <MetricCard
                title="Active Companies"
                value={stats.companies}
                icon="building"
                color="purple"
                trend={getTrendText(stats.companies, 'companies')}
              />
              <MetricCard
                title="Active Loans"
                value={stats.activeLoans}
                icon="php-text"
                color="green"
                trend={getTrendText(stats.activeLoans, 'loans')}
              />
              <MetricCard
                title="Payment Rate"
                value={`${stats.paymentRate}%`}
                icon="chart-bar"
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
                icon="banknotes"
                color="green"
                trend={getTrendText(stats.totalLoanAmount, 'loans')}
              />
              <FinancialCard
                title="Total Repaid"
                value={formatCurrency(stats.totalRepaid)}
                subtitle={`${stats.paidRepayments} payments received`}
                icon="check-circle"
                color="blue"
                trend={formatPercentage(stats.totalRepaid, stats.totalLoanAmount)}
              />
              <FinancialCard
                title="Outstanding Balance"
                value={formatCurrency(stats.outstandingBalance)}
                subtitle={`${stats.unpaidRepayments} pending repayments`}
                icon="exclamation-triangle"
                color={stats.outstandingBalance > 0 ? "red" : "gray"}
                trend={getTrendText(stats.outstandingBalance, 'loans')}
              />
            </div>

            {/* Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <ActivityItem
                    icon="document-text"
                    title="New Loans"
                    value={stats.recentLoans}
                    period="this month"
                    color="green"
                  />
                  <ActivityItem
                    icon="credit-card"
                    title="Payments Received"
                    value={stats.recentPayments}
                    period="this month"
                    color="blue"
                  />
                  <ActivityItem
                    icon="clock"
                    title="Overdue Repayments"
                    value={stats.overdueRepayments}
                    period="currently"
                    color="red"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton
                    title="Add Loan"
                    icon="php-text"
                    href="/admin/loans"
                    color="green"
                  />
                  <QuickActionButton
                    title="Add Company"
                    icon="building-office"
                    href="/admin/companies"
                    color="blue"
                  />
                  <QuickActionButton
                    title="View Reports"
                    icon="chart-bar"
                    href="/admin/reports"
                    color="purple"
                  />
                  <QuickActionButton
                    title="Manage Users"
                    icon="users"
                    href="/admin/users"
                    color="orange"
                  />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Status
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

  const getIcon = (iconName) => {
    const icons = {
      users: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
        </svg>
      ),
      building: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      "currency-dollar": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M15 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h8M8 16h8" />
        </svg>
      ),
      "chart-bar": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      "php-text": (
        <span className="text-white font-bold text-lg">PHP</span>
      )
    };
    return icons[iconName] || icons.users;
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-4 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white">
          {getIcon(icon)}
        </div>
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

  const getIcon = (iconName) => {
    const icons = {
      banknotes: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      "check-circle": (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "exclamation-triangle": (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    };
    return icons[iconName] || icons.banknotes;
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white">
          {getIcon(icon)}
        </div>
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

  const getIcon = (iconName) => {
    const icons = {
      "document-text": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      "credit-card": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[iconName] || icons["document-text"];
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-white">
          {getIcon(icon)}
        </div>
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

  const getIcon = (iconName) => {
    const icons = {
      "currency-dollar": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      "php-text": (
        <span className="text-white font-bold text-lg">PHP</span>
      ),
      "building-office": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      "chart-bar": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      users: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
        </svg>
      )
    };
    return icons[iconName] || icons["currency-dollar"];
  };

  return (
    <Link
      href={href}
      className={`${colors[color]} rounded-lg p-4 text-center transition-colors duration-200 flex flex-col items-center space-y-2`}
    >
      <div>
        {getIcon(icon)}
      </div>
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