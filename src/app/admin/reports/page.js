"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
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
      const res = await fetch("/api/reports");
      if (!res.ok) {
        throw new Error('Failed to load reports');
      }
      setStats(await res.json());
    } catch {
      setError("Failed to load reports");
    }
  }

  function Stat({ label, value, color = "green" }) {
    const colors = {
      green: "bg-green-400/20 text-green-400 border-green-400/30",
      blue: "bg-blue-400/20 text-blue-400 border-blue-400/30",
      orange: "bg-orange-400/20 text-orange-400 border-orange-400/30",
      purple: "bg-purple-400/20 text-purple-400 border-purple-400/30",
      red: "bg-red-400/20 text-red-400 border-red-400/30"
    };
    return (
      <div className={`${colors[color]} rounded-xl p-3 border backdrop-blur-sm`}>
        <div className="text-xs font-semibold mb-1">{label}</div>
        <div className="text-xl font-bold">{value}</div>
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
    return (
      <div className="relative h-screen overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
            <div></div>
          </div>
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-white">Loading reports...</div>
        </div>
      </div>
    );
  }

  // Chart configurations
  const monthlyLoansData = {
    labels: stats.charts?.monthlyLoans?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Loans',
        data: stats.charts?.monthlyLoans?.map(item => item.count) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Payments',
        data: stats.charts?.monthlyPayments?.map(item => item.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ],
  };

  const roleDistributionData = {
    labels: stats.charts?.roleDistribution?.map(item => item.role) || [],
    datasets: [{
      data: stats.charts?.roleDistribution?.map(item => item.count) || [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(249, 115, 22, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const loanStatusData = {
    labels: stats.charts?.loanStatusDistribution?.map(item => item.status) || [],
    datasets: [{
      data: stats.charts?.loanStatusDistribution?.map(item => item.count) || [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'white',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'white',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
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
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 pt-20">
      {/* Background Pattern - Full Screen */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Content - Full width layout */}
      <div className="relative z-10 px-4 py-3">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">Reports & Analytics</h1>
          
          {error && <p className="text-red-300 text-sm text-center mb-3">{error}</p>}
          
          <div className="space-y-6">
            {/* Key Statistics */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Key Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Users" value={stats.users} color="blue" />
                <Stat label="Companies" value={stats.companies} color="purple" />
                <Stat label="Active Loans" value={stats.activeLoans} color="green" />
                <Stat label="Total Repayments" value={stats.totalRepayments} color="orange" />
              </div>
            </div>

            {/* Financial Summary */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Financial Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="Total Loan Amount" value={formatCurrency(stats.totalLoanAmount)} color="green" />
                <Stat label="Total Repaid" value={formatCurrency(stats.totalRepaid)} color="blue" />
                <Stat label="Outstanding Balance" value={formatCurrency(stats.outstandingBalance)} color="red" />
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Activity</h3>
                <div className="h-64">
                  <Bar data={monthlyLoansData} options={chartOptions} />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">User Role Distribution</h3>
                <div className="h-64">
                  <Doughnut data={roleDistributionData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Loan Status Distribution</h3>
                <div className="h-64">
                  <Doughnut data={loanStatusData} options={doughnutOptions} />
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Repayment Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Paid Repayments" value={stats.paidRepayments} color="green" />
                  <Stat label="Unpaid Repayments" value={stats.unpaidRepayments} color="red" />
                  <Stat label="Payment Rate" value={`${stats.paymentRate}%`} color="blue" />
                  <Stat label="Overdue" value={stats.overdueRepayments} color="orange" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity (This Month)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="New Loans" value={stats.recentLoans} color="green" />
                <Stat label="New Payments" value={stats.recentPayments} color="blue" />
                <Stat label="Overdue Repayments" value={stats.overdueRepayments} color="red" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 