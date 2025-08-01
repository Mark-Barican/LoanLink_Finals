"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ManagerNavbar from "../ManagerNavbar";

// Dynamically import Link to avoid prerendering issues
const DynamicLink = dynamic(() => import("next/link"), { ssr: false });

// Skeleton Loading Component
function ManagerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation Skeleton */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-24 h-10 bg-slate-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-16 h-4 bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-10 bg-red-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="mb-10">
            <div className="w-64 h-10 bg-slate-800/50 rounded-lg animate-pulse mb-3"></div>
            <div className="w-96 h-6 bg-slate-800/50 rounded animate-pulse"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-24 h-4 bg-slate-700 rounded animate-pulse"></div>
                  <div className="w-12 h-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
                </div>
                <div className="w-20 h-8 bg-slate-700 rounded animate-pulse mb-3"></div>
                <div className="w-32 h-3 bg-slate-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="w-32 h-6 bg-slate-700 rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="w-full h-14 bg-slate-700/50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="w-40 h-6 bg-slate-700 rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/30">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-slate-700 rounded animate-pulse mb-1"></div>
                        <div className="w-24 h-3 bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="w-20 h-4 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "manager") {
      router.replace("/auth");
      return;
    }
    fetchStats();
  }, [router]);

  async function fetchStats() {
    try {
      setError("");
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      
      console.log('Fetching stats for user:', user);
      
      const res = await fetch("/api/reports", {
        headers: {
          'x-user-role': user?.role || 'manager'
        }
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch stats`);
      }
      
      const data = await res.json();
      console.log('Stats data received:', data);
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ManagerDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ManagerNavbar currentPage="dashboard" />

      {/* Main Content */}
      <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">
        {error && (
          <div className="mb-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Manager Dashboard</h1>
          <p className="text-slate-400 text-lg">Welcome back! Here&apos;s your comprehensive overview</p>
        </div>

        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Loans"
              value={stats.totalLoans || 0}
              icon="document-text"
              color="blue"
              trend={stats.trends?.loans || 0}
            />
            <MetricCard
              title="Active Loans"
              value={stats.activeLoans || 0}
              icon="check-circle"
              color="green"
              trend={0}
            />
            <MetricCard
              title="Total Collections"
              value={formatCurrency(stats.totalRepaid || 0)}
              icon="banknotes"
              color="purple"
              trend={stats.trends?.payments || 0}
            />
            <MetricCard
              title="Outstanding Balance"
              value={formatCurrency(stats.outstandingBalance || 0)}
              icon="exclamation-triangle"
              color="orange"
              trend={0}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <QuickActionButton
                    title="Review Loans"
                    icon="document-check"
                    href="/manager/loans"
                    color="green"
                  />
                  <QuickActionButton
                    title="Company Overview"
                    icon="building-office"
                    href="/manager/companies"
                    color="blue"
                  />
                  <QuickActionButton
                    title="Payment Management"
                    icon="banknotes"
                    href="/manager/payments"
                    color="purple"
                  />
                  <QuickActionButton
                    title="Repayment Schedule"
                    icon="calendar"
                    href="/manager/repayments"
                    color="orange"
                  />
                  <QuickActionButton
                    title="Staff Management"
                    icon="users"
                    href="/manager/staff"
                    color="indigo"
                  />
                  <QuickActionButton
                    title="Reports & Analytics"
                    icon="chart-bar"
                    href="/manager/reports"
                    color="pink"
                  />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <ActivityItem
                    icon="document-plus"
                    title="New loan application"
                    value="₱75,000"
                    period="2 hours ago"
                    color="green"
                  />
                  <ActivityItem
                    icon="banknotes"
                    title="Payment received"
                    value="₱30,000"
                    period="4 hours ago"
                    color="blue"
                  />
                  <ActivityItem
                    icon="building-office"
                    title="Company registered"
                    value="TechCorp Inc."
                    period="6 hours ago"
                    color="purple"
                  />
                  <ActivityItem
                    icon="user-plus"
                    title="Staff member added"
                    value="jane.smith@company.com"
                    period="1 day ago"
                    color="orange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount || 0);
}

function getTrendText(value, type) {
  if (type === 'currency') {
    return value >= 0 ? `+${formatCurrency(value)}` : formatCurrency(Math.abs(value));
  }
  return value >= 0 ? `+${value}%` : `${Math.abs(value)}%`;
}

// Component Definitions
function MetricCard({ title, value, icon, color, trend }) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  const getIcon = (iconName) => {
    const icons = {
      "document-text": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      "check-circle": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "banknotes": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      "exclamation-triangle": (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    };
    return icons[iconName] || icons["document-text"];
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}>
          {getIcon(icon)}
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-3">{value}</div>
      <div className="flex items-center text-xs text-slate-400">
        <span className={`mr-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? "↗" : "↘"}
        </span>
        <span className="font-medium">{getTrendText(trend, typeof value === 'string' ? 'currency' : 'number')}</span>
        <span className="ml-1">from last month</span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, value, period, color }) {
  const colorClasses = {
    green: "bg-green-500/20 text-green-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    orange: "bg-orange-500/20 text-orange-400"
  };

  const getIcon = (iconName) => {
    const icons = {
      "document-plus": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      "banknotes": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      "building-office": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      "user-plus": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    };
    return icons[iconName] || icons["document-plus"];
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300">
      <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}>
        {getIcon(icon)}
      </div>
      <div className="flex-1">
        <div className="text-white font-semibold">{title}</div>
        <div className="text-slate-400 text-sm">{period}</div>
      </div>
      <div className="text-white font-bold text-lg">{value}</div>
    </div>
  );
}

function QuickActionButton({ title, icon, href, color }) {
  const colorClasses = {
    green: "bg-green-600 hover:bg-green-500 text-white",
    blue: "bg-blue-600 hover:bg-blue-500 text-white",
    purple: "bg-purple-600 hover:bg-purple-500 text-white",
    orange: "bg-orange-600 hover:bg-orange-500 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-500 text-white",
    pink: "bg-pink-600 hover:bg-pink-500 text-white"
  };

  const getIcon = (iconName) => {
    const icons = {
      "document-check": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "building-office": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      "banknotes": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      "calendar": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      "users": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      "chart-bar": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    };
    return icons[iconName] || icons["document-check"];
  };

  return (
    <DynamicLink href={href}>
      <button className={`w-full flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${colorClasses[color]}`}>
        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
          {getIcon(icon)}
        </div>
        <span className="font-semibold">{title}</span>
      </button>
    </DynamicLink>
  );
} 