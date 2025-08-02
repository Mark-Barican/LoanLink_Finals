"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffNavbar from "../StaffNavbar";

export default function StaffReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const router = useRouter();

  useEffect(() => {
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!userData || userData.role !== "staff") {
      router.replace("/auth");
      return;
    }
    setUser(userData);
    fetchStats();
  }, [router, timeRange]);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?timeRange=${timeRange}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'staff'
        }
      });
      if (!res.ok) throw new Error('Failed to load reports');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Fetch reports error:', e);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercentage(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      <StaffNavbar currentPage="reports" />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(249,115,22,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-6 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-orange-400 mb-1">Reports & Analytics</h1>
            <p className="text-white/60 text-sm">Comprehensive financial reports and performance metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-400"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-20 px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-orange-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white/60">Loading reports...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Total Users</div>
                    <div className="text-white text-2xl font-bold">{stats.users || 0}</div>
                  </div>
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Active Companies</div>
                    <div className="text-white text-2xl font-bold">{stats.companies || 0}</div>
                  </div>
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Active Loans</div>
                    <div className="text-white text-2xl font-bold">{stats.activeLoans || 0}</div>
                  </div>
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-sm mb-2">Payment Rate</div>
                    <div className="text-white text-2xl font-bold">{stats.paymentRate ? `${stats.paymentRate}%` : '0%'}</div>
                  </div>
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white/60 text-sm">Total Portfolio</div>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-white text-2xl font-bold">{formatCurrency(stats.totalLoanAmount || 0)}</div>
                <div className="text-green-400 text-sm mt-2">+{formatPercentage(stats.portfolioGrowth || 0)} from last period</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white/60 text-sm">Total Repaid</div>
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-white text-2xl font-bold">{formatCurrency(stats.totalRepaid || 0)}</div>
                <div className="text-blue-400 text-sm mt-2">+{formatPercentage(stats.repaymentGrowth || 0)} from last period</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white/60 text-sm">Outstanding</div>
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="text-white text-2xl font-bold">{formatCurrency(stats.outstandingBalance || 0)}</div>
                <div className="text-orange-400 text-sm mt-2">{formatPercentage(stats.outstandingRatio || 0)} of total portfolio</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Loan Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Active Loans</span>
                    <span className="text-white font-semibold">{stats.activeLoans || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Completed Loans</span>
                    <span className="text-white font-semibold">{stats.completedLoans || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Default Rate</span>
                    <span className="text-red-400 font-semibold">{formatPercentage(stats.defaultRate || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Average Loan Size</span>
                    <span className="text-white font-semibold">{formatCurrency(stats.averageLoanSize || 0)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Analytics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Payments</span>
                    <span className="text-white font-semibold">{stats.totalPayments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">On-Time Payments</span>
                    <span className="text-green-400 font-semibold">{formatPercentage(stats.onTimePaymentRate || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Late Payments</span>
                    <span className="text-yellow-400 font-semibold">{formatPercentage(stats.latePaymentRate || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Average Payment</span>
                    <span className="text-white font-semibold">{formatCurrency(stats.averagePayment || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Performing Clients Section */}
            {stats.topPerformingCompanies && stats.topPerformingCompanies.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Best Performing Clients</h3>
                
                {/* Performance Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-green-400 text-sm font-medium">Total Principal</div>
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalPrincipal, 0))}
                    </div>
                    <div className="text-green-400/60 text-xs mt-1">Across top clients</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-orange-400 text-sm font-medium">Interest Earned</div>
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(stats.topPerformingCompanies.reduce((sum, company) => sum + company.totalInterest, 0))}
                    </div>
                    <div className="text-orange-400/60 text-xs mt-1">Add-On Method</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-blue-400 text-sm font-medium">Avg Repayment Rate</div>
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {Math.round(stats.topPerformingCompanies.reduce((sum, company) => sum + company.repaymentRate, 0) / stats.topPerformingCompanies.length)}%
                    </div>
                    <div className="text-blue-400/60 text-xs mt-1">Collection efficiency</div>
                  </div>
                </div>

                {/* Client Performance Table */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-1">Client Performance Analysis</h4>
                    <p className="text-white/60 text-xs">
                      Based on Philippine Add-On Interest Method - showing principal, calculated interest, and repayment efficiency.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Loans</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Principal</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Interest</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Paid</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topPerformingCompanies.map((company, index) => (
                          <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-medium text-sm">{company.company}</td>
                            <td className="px-4 py-3 text-white/80 text-sm">{company.loanCount}</td>
                            <td className="px-4 py-3 text-white/80 text-sm">{formatCurrency(company.totalPrincipal)}</td>
                            <td className="px-4 py-3 text-orange-400 text-sm">{formatCurrency(company.totalInterest)}</td>
                            <td className="px-4 py-3 text-blue-400 text-sm">{formatCurrency(company.totalPaid)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                company.repaymentRate >= 80 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : company.repaymentRate >= 60
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {company.repaymentRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Performers Summary */}
                <div className="bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-xl p-4 border border-green-500/20">
                  <h4 className="text-lg font-semibold text-white mb-3">Top 3 Performers</h4>
                  <div className="space-y-2">
                    {stats.topPerformingCompanies.slice(0, 3).map((company, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-500/20 text-gray-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-medium text-sm">{company.company}</span>
                        </div>
                        <span className="text-green-400 font-semibold text-sm">{company.repaymentRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-white/60 text-lg">No reports data available</p>
              <p className="text-white/40 text-sm">Try selecting a different time range</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 