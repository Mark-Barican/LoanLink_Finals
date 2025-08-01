"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffNavbar from "../StaffNavbar";

export default function StaffLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!userData || userData.role !== "staff") {
      router.replace("/auth");
      return;
    }
    setUser(userData);
    fetchLoans();
  }, [router]);

  async function fetchLoans() {
    try {
      setLoading(true);
      const res = await fetch("/api/loans", {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'staff'
        }
      });
      if (!res.ok) throw new Error('Failed to load loans');
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch loans error:', e);
      setError("Failed to load loans");
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'defaulted':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      <StaffNavbar currentPage="loans" />
      
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
            <h1 className="text-2xl font-bold text-orange-400 mb-1">Loans</h1>
            <p className="text-white/60 text-sm">Manage loan applications and track repayment status</p>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs">Total Loans</div>
            <div className="text-white text-lg font-semibold">{loans.length}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-white/60 text-sm mb-2">Search Loans</label>
              <input
                type="text"
                placeholder="Search by company name or loan code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-white/60 text-sm mb-2">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>
          </div>
        </div>
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
              <p className="text-white/60">Loading loans...</p>
            </div>
          </div>
        ) : filteredLoans.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} formatCurrency={formatCurrency} formatDate={formatDate} getStatusColor={getStatusColor} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-white/60 text-lg">No loans found</p>
              <p className="text-white/40 text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoanCard({ loan, formatCurrency, formatDate, getStatusColor }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{loan.code || `Loan #${loan.id}`}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
              {loan.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-white/60 text-sm">{loan.company_name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="text-white font-semibold">{formatCurrency(loan.principal)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-white/60 text-sm">{loan.interest_rate}% interest</span>
        </div>

        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-white/60 text-sm">{loan.term_months} months</span>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white/60 text-xs">Created</div>
              <div className="text-white text-sm">{formatDate(loan.created_at)}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">Updated</div>
              <div className="text-white text-sm">{formatDate(loan.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 