"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import components to avoid prerendering issues
const DynamicLink = dynamic(() => import("next/link"), { ssr: false });
const AdminNavbar = dynamic(() => import("./AdminNavbar"), { ssr: false });

// Skeleton Loading Component
function AdminDashboardSkeleton() {
  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Header Skeleton */}
      <div className="relative z-10 pt-24 px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="w-64 h-10 bg-white/10 rounded-lg animate-pulse mb-2"></div>
            <div className="w-48 h-6 bg-white/10 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="w-20 h-3 bg-white/10 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
            </div>
            <div className="w-24 h-10 bg-white/10 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="relative z-10 px-6 pb-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Key Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-16 h-8 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="w-20 h-3 bg-white/10 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Financial Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-32 h-5 bg-white/10 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-24 h-8 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="w-20 h-3 bg-white/10 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Quick Actions and Activity Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="w-32 h-6 bg-white/10 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl">
                      <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                      <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="w-40 h-6 bg-white/10 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                      <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="w-24 h-3 bg-white/10 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Status Skeleton */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <div className="w-32 h-6 bg-white/10 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="w-20 h-4 bg-white/10 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-white/10 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      setError("");
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch("/api/reports", {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'admin'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to load stats`);
      }
      
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Fetch stats error:', e);
      setError(e.message || "Failed to load stats. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!userData || userData.role !== "admin") {
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
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <AdminNavbar currentPage="dashboard" />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 pt-24 px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-green-400 mb-2">Admin Dashboard</h1>
            <p className="text-white/60 text-lg">Welcome back, {user.email}</p>
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
          <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-sm rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-8 max-w-7xl mx-auto">
        {loading ? (
          <AdminDashboardSkeleton />
        ) : stats ? (
                      <div className="space-y-8">
              {/* Key Metrics - Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                title="Total Repayments"
                value={stats.totalRepayments}
                icon="chart-bar"
                color="orange"
                trend={getTrendText(stats.totalRepayments, 'repayments')}
              />
            </div>

            {/* Financial Cards - Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FinancialCard
                title="Total Loan Portfolio"
                value={formatCurrency(stats.totalLoanAmount)}
                subtitle="Total amount lent"
                icon="php-text"
                color="green"
                trend={formatCurrency(stats.totalLoanAmount)}
              />
              <FinancialCard
                title="Total Collections"
                value={formatCurrency(stats.totalRepaid)}
                subtitle="Total amount collected"
                icon="banknotes"
                color="blue"
                trend={formatCurrency(stats.totalRepaid)}
              />
              <FinancialCard
                title={stats.isOverpaid ? "Overpayment" : "Outstanding Balance"}
                value={formatCurrency(stats.outstandingBalance)}
                subtitle={stats.isOverpaid ? "Excess payments received" : "Amount still owed"}
                icon={stats.isOverpaid ? "check-circle" : "exclamation-triangle"}
                color={stats.isOverpaid ? "green" : "red"}
                trend={formatCurrency(stats.outstandingBalance)}
              />
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <QuickActionButton
                      title="Add New Loan"
                      icon="plus-circle"
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

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <ActivityItem
                      icon="plus-circle"
                      title="New loan created"
                      value="₱50,000"
                      period="2 hours ago"
                      color="green"
                    />
                    <ActivityItem
                      icon="banknotes"
                      title="Payment received"
                      value="₱25,000"
                      period="4 hours ago"
                      color="blue"
                    />
                    <ActivityItem
                      icon="building-office"
                      title="New company registered"
                      value="TechCorp Inc."
                      period="6 hours ago"
                      color="purple"
                    />
                    <ActivityItem
                      icon="user-plus"
                      title="New user added"
                      value="john.doe@company.com"
                      period="1 day ago"
                      color="orange"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusItem
                  title="Database"
                  status="Online"
                  color="green"
                />
                <StatusItem
                  title="API Services"
                  status="Online"
                  color="green"
                />
                <StatusItem
                  title="Payment Gateway"
                  status="Online"
                  color="green"
                />
                <StatusItem
                  title="Email Service"
                  status="Online"
                  color="green"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">No data available</p>
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
        <span className="text-white font-bold text-lg">₱</span>
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
    <div className={`${colors[color]} border rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white">
          {getIcon(icon)}
        </div>
        <span className="text-xs text-white/60">{trend}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
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
    <div className={`${colors[color]} border rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white">
          {getIcon(icon)}
        </div>
        <span className="text-xs text-white/60">{trend}</span>
      </div>
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
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
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-200">
      <div className="flex items-center space-x-4">
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
        <span className="text-white font-bold text-lg">₱</span>
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
      ),
      "plus-circle": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12V12.75z" />
        </svg>
      ),
      "user-plus": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a6 6 0 01-6 6H6a6 6 0 01-6-6v-1a4 4 0 014-4h10a4 4 0 014 4v1a6 6 0 01-6 6zm-7 0H6a1 1 0 00-1 1v1a1 1 0 001 1h10a1 1 0 001-1v-1a1 1 0 00-1-1H6z" />
        </svg>
      )
    };
    return icons[iconName] || icons["php-text"];
  };

  return (
    <DynamicLink
      href={href}
      className={`${colors[color]} rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col items-center space-y-2`}
    >
      <div className="bg-white/20 rounded-lg p-2">
        {getIcon(icon)}
      </div>
      <span className="text-sm font-medium">{title}</span>
    </DynamicLink>
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
    <div className="text-center p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-200">
      <div className="text-white/60 text-sm mb-2">{title}</div>
      <div className={`font-semibold ${colors[color]}`}>{status}</div>
    </div>
  );
} 