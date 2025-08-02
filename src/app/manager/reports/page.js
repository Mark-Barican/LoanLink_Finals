"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Dynamically import components to avoid prerendering issues
const ManagerNavbar = dynamic(() => import("../ManagerNavbar"), { ssr: false });

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Skeleton Loading Component
function ReportsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Skeleton */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-48 h-8 bg-white/10 rounded-lg animate-pulse mb-2"></div>
              <div className="w-32 h-4 bg-white/10 rounded animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-1"></div>
              <div className="w-32 h-5 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Skeleton */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-24 h-12 bg-white/10 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Skeleton */}
        <div className="mb-8">
          <div className="w-48 h-6 bg-white/10 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-32 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="w-24 h-8 bg-white/10 rounded animate-pulse mb-1"></div>
                <div className="w-20 h-3 bg-white/10 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="mb-8">
          <div className="w-64 h-6 bg-white/10 rounded animate-pulse mb-6"></div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="h-80 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="w-28 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
              <div className="w-20 h-8 bg-white/10 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-3 bg-white/10 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchStats();
  }, [router]);

  async function fetchStats() {
    try {
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch("/api/reports", {
        headers: {
          'x-user-role': user?.role || 'manager'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load reports');
      }
      setStats(await res.json());
    } catch {
      setError("Failed to load reports");
    }
  }

  function Stat({ label, value, color = "green", subtitle = "", icon = null }) {
    const colors = {
      green: "bg-green-500/10 text-green-400 border-green-500/20",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      red: "bg-red-500/10 text-red-400 border-red-500/20",
      yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    };
    return (
      <div className={`${colors[color]} rounded-xl p-6 border backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
        <div className="flex items-center justify-center mb-2">
          <div className="text-sm font-medium opacity-80">{label}</div>
        </div>
        <div className="text-2xl font-bold mb-1 text-center">{value}</div>
        {subtitle && <div className="text-xs opacity-60 text-center">{subtitle}</div>}
        {icon && <div className="flex justify-center mt-3">{icon}</div>}
      </div>
    );
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (!stats) {
    return <ReportsSkeleton />;
  }

  // Chart configurations
  const monthlyLoansData = {
    labels: stats.charts?.monthlyLoans?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Loan Amount',
        data: stats.charts?.monthlyLoans?.map(item => item.amount) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Payment Amount',
        data: stats.charts?.monthlyPayments?.map(item => item.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const paymentMethodsData = {
    labels: stats.charts?.paymentMethodsDistribution?.map(item => item.method) || [],
    datasets: [{
      data: stats.charts?.paymentMethodsDistribution?.map(item => item.amount) || [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(168, 85, 247, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const companyLoanData = {
    labels: stats.charts?.companyLoanDistribution?.map(item => item.company) || [],
    datasets: [
      {
        label: 'Total Loan Amount',
        data: stats.charts?.companyLoanDistribution?.map(item => item.totalAmount) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ],
  };

  const repaymentTrendData = {
    labels: stats.charts?.repaymentStatusByMonth?.map(item => item.month) || [],
    datasets: [{
      label: 'Paid Repayments',
      data: stats.charts?.repaymentStatusByMonth?.filter(item => item.status === 'paid').map(item => item.count) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      tension: 0.4,
    }, {
      label: 'Unpaid Repayments',
      data: stats.charts?.repaymentStatusByMonth?.filter(item => item.status === 'unpaid').map(item => item.count) || [],
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 2,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
          font: { size: 12 },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: { size: 11 },
          usePointStyle: true,
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ) },
    { id: "financials", label: "Financials", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ) },
    { id: "companies", label: "Companies", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ) },
    { id: "performance", label: "Performance", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Manager Navbar */}
      <ManagerNavbar currentPage="reports" />
      
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 pt-24">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
              <p className="text-white/60 text-sm">Operational insights and actionable reports</p>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-sm">Last Updated</div>
              <div className="text-white font-medium">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Key Business Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat 
                  label="Total Loan Portfolio" 
                  value={formatCurrency(stats.totalLoanAmount)} 
                  color="green"
                  subtitle="Total amount lent"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                />
                <Stat 
                  label="Total Collections" 
                  value={formatCurrency(stats.totalRepaid)} 
                  color="blue"
                  subtitle="Total amount collected"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  )}
                />
                <Stat 
                  label={stats.isOverpaid ? "Overpayment" : "Outstanding Balance"} 
                  value={formatCurrency(stats.outstandingBalance)} 
                  color={stats.isOverpaid ? "green" : "red"}
                  subtitle={stats.isOverpaid ? "Excess payments received" : "Amount still owed"}
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.isOverpaid ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"} />
                    </svg>
                  )}
                />
                <Stat 
                  label="Payment Rate" 
                  value={`${stats.paymentRate}%`} 
                  color="purple"
                  subtitle="Collection efficiency"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                />
              </div>
            </div>

            {/* Monthly Trends */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Monthly Cash Flow Trends</h2>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="h-80">
                  <Line data={monthlyLoansData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Stat 
                label="Active Loans" 
                value={stats.activeLoans} 
                color="green"
                subtitle="Currently active"
                icon={(
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              />
              <Stat 
                label="Total Companies" 
                value={stats.companies} 
                color="blue"
                subtitle="Borrowing clients"
                icon={(
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              />
              <Stat 
                label="Overdue Amount" 
                value={formatCurrency(stats.overdueAmount)} 
                color="red"
                subtitle="Past due payments"
                icon={(
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              />
            </div>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === "financials" && (
          <div className="space-y-8">
            {/* Financial Summary */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Financial Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat 
                  label="Average Loan Size" 
                  value={formatCurrency(stats.averageLoanAmount)} 
                  color="green"
                  subtitle="Per loan"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                />
                <Stat 
                  label="Average Repayment" 
                  value={formatCurrency(stats.averageRepaymentAmount)} 
                  color="blue"
                  subtitle="Per repayment"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                />
                <Stat 
                  label="Paid Repayments" 
                  value={stats.paidRepayments} 
                  color="green"
                  subtitle="Successfully collected"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                />
                <Stat 
                  label="Unpaid Repayments" 
                  value={stats.unpaidRepayments} 
                  color="red"
                  subtitle="Pending collection"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Payment Method Distribution</h2>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="h-80">
                  <Doughnut data={paymentMethodsData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* Repayment Trends */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Repayment Collection Trends</h2>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="h-80">
                  <Line data={repaymentTrendData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="space-y-8">
            {/* Company Loan Distribution */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Top Borrowing Companies</h2>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="h-80">
                  <Bar data={companyLoanData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Top Performing Companies */}
            {stats.topPerformingCompanies && stats.topPerformingCompanies.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Best Performing Clients</h2>
                
                {/* Performance Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-green-400 text-sm font-medium">Total Principal Lent</div>
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalPrincipal, 0))}
                    </div>
                    <div className="text-green-400/60 text-sm mt-2">Across all top clients</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-orange-400 text-sm font-medium">Total Interest Earned</div>
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalInterest, 0))}
                    </div>
                    <div className="text-orange-400/60 text-sm mt-2">Philippine Add-On Method</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-blue-400 text-sm font-medium">Average Repayment Rate</div>
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {Math.round(stats.topPerformingCompanies.reduce((sum, company) => sum + company.repaymentRate, 0) / stats.topPerformingCompanies.length)}%
                    </div>
                    <div className="text-blue-400/60 text-sm mt-2">Collection efficiency</div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Client Performance Comparison</h3>
                  <div className="h-80">
                    <Bar 
                      data={{
                        labels: stats.topPerformingCompanies.map(item => item.company),
                        datasets: [
                          {
                            label: 'Principal Amount',
                            data: stats.topPerformingCompanies.map(item => item.totalPrincipal),
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 1,
                          },
                          {
                            label: 'Interest Earned',
                            data: stats.topPerformingCompanies.map(item => item.totalInterest),
                            backgroundColor: 'rgba(249, 115, 22, 0.8)',
                            borderColor: 'rgba(249, 115, 22, 1)',
                            borderWidth: 1,
                          },
                          {
                            label: 'Amount Paid',
                            data: stats.topPerformingCompanies.map(item => item.totalPaid),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                          }
                        ]
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                </div>

                {/* Detailed Table with Enhanced Context */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">Detailed Client Analysis</h3>
                    <p className="text-white/60 text-sm">
                      Performance metrics based on Philippine Add-On Interest Method. Shows principal amounts, calculated interest, 
                      actual payments received, and repayment efficiency rates.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Company</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Active Loans</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Principal</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Interest</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Total Owed</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Paid</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Outstanding</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Repayment Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topPerformingCompanies.map((company, index) => {
                          const totalOwed = company.totalPrincipal + company.totalInterest;
                          const outstanding = totalOwed - company.totalPaid;
                          return (
                            <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-white font-medium">{company.company}</td>
                              <td className="px-6 py-4 text-white/80">{company.loanCount}</td>
                              <td className="px-6 py-4 text-white/80">{formatCurrency(company.totalPrincipal)}</td>
                              <td className="px-6 py-4 text-orange-400">{formatCurrency(company.totalInterest)}</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">{formatCurrency(totalOwed)}</td>
                              <td className="px-6 py-4 text-blue-400">{formatCurrency(company.totalPaid)}</td>
                              <td className="px-6 py-4 text-red-400">{formatCurrency(outstanding)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    company.repaymentRate >= 80 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : company.repaymentRate >= 60
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    {company.repaymentRate}%
                                  </span>
                                  <div className="w-16 bg-white/10 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        company.repaymentRate >= 80 ? 'bg-green-400' : 
                                        company.repaymentRate >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                      }`}
                                      style={{ width: `${company.repaymentRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-xl p-6 border border-green-500/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Top Performers</h4>
                    <div className="space-y-3">
                      {stats.topPerformingCompanies.slice(0, 3).map((company, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-500/20 text-gray-400' :
                              'bg-orange-500/20 text-orange-400'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-white font-medium">{company.company}</span>
                          </div>
                          <span className="text-green-400 font-semibold">{company.repaymentRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-xl p-6 border border-blue-500/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Key Insights</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80">Average principal per client: {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalPrincipal, 0) / stats.topPerformingCompanies.length)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-white/80">Average interest earned: {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalInterest, 0) / stats.topPerformingCompanies.length)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-white/80">Total outstanding: {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + (company.totalPrincipal + company.totalInterest - company.totalPaid), 0))}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white/80">Collection efficiency: {Math.round(stats.topPerformingCompanies.reduce((sum, company) => sum + company.repaymentRate, 0) / stats.topPerformingCompanies.length)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-8">
            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">This Month&apos;s Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Stat 
                  label="New Loans" 
                  value={stats.recentLoans} 
                  color="green"
                  subtitle="Loans created this month"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                />
                <Stat 
                  label="New Payments" 
                  value={stats.recentPayments} 
                  color="blue"
                  subtitle="Payments received this month"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  )}
                />
                <Stat 
                  label="Overdue Items" 
                  value={stats.overdueRepayments} 
                  color="red"
                  subtitle="Past due repayments"
                  icon={(
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                />
              </div>
            </div>

            {/* Risk Metrics */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Risk Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Health</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Collection Rate</span>
                      <span className="text-green-400 font-semibold">{stats.paymentRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Overdue Ratio</span>
                      <span className="text-red-400 font-semibold">
                        {stats.totalRepayments > 0 ? Math.round((stats.overdueRepayments / stats.totalRepayments) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Average Loan Size</span>
                      <span className="text-blue-400 font-semibold">{formatCurrency(stats.averageLoanAmount)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Cash Flow Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Total Outstanding</span>
                      <span className="text-orange-400 font-semibold">{formatCurrency(stats.outstandingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Overdue Amount</span>
                      <span className="text-red-400 font-semibold">{formatCurrency(stats.overdueAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Collection Efficiency</span>
                      <span className={`font-semibold ${stats.paymentRate >= 80 ? 'text-green-400' : stats.paymentRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {stats.paymentRate >= 80 ? 'Excellent' : stats.paymentRate >= 60 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 