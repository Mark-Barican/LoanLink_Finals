"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ManagerNavbar from "../ManagerNavbar";

export default function ManagerLoanManagement() {
  const [loans, setLoans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "manager") {
      router.replace("/auth");
      return;
    }
    fetchLoans();
    fetchCompanies();
  }, [router]);

  async function fetchLoans() {
    try {
      setError("");
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch("/api/loans", {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'manager'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch loans');
      }
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch loans error:', err);
      setError("Failed to load loans");
    }
  }

  async function fetchCompanies() {
    try {
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch("/api/companies", {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'manager'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch companies error:', err);
      setError("Failed to load companies");
    }
  }

  function viewDetails(loan) {
    setSelectedLoan(loan);
    setShowDetails(true);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100';
      case 'completed': return 'text-blue-500 bg-blue-100';
      case 'defaulted': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  }

  function getCompanyName(companyId) {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  }

  if (loading) {
  return (
      <div className="min-h-screen bg-slate-950">
        <ManagerNavbar currentPage="loans" />
        <div className="pt-20 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-800 rounded"></div>
              ))}
            </div>
            <div className="bg-slate-800 shadow rounded-lg">
              <div className="h-96 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeLoans = loans.filter(loan => loan.status === 'active');
  const completedLoans = loans.filter(loan => loan.status === 'completed');
  const totalLoanAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.principal), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <ManagerNavbar currentPage="loans" />
      <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Loan Management</h1>
          <p className="text-slate-400 text-lg">Review and monitor loan applications and status</p>
      </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <dt className="text-sm font-medium text-slate-400">Total Loans</dt>
                <dd className="text-2xl font-bold text-white">{loans.length}</dd>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <dt className="text-sm font-medium text-slate-400">Active Loans</dt>
                <dd className="text-2xl font-bold text-white">{activeLoans.length}</dd>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <dt className="text-sm font-medium text-slate-400">Total Amount</dt>
                <dd className="text-2xl font-bold text-white">{formatCurrency(totalLoanAmount)}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <div className="mt-2 text-sm text-red-200">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loans Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl border border-slate-700/50">
          <div className="px-6 py-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              All Loans
            </h3>
            <p className="text-slate-400">Complete list of loan applications and their current status</p>
          </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Interest Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {getCompanyName(loan.company_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatCurrency(loan.principal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {loan.interest_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {loan.term_months} months
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatDate(loan.start_date)}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status}
                          </span>
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                        onClick={() => viewDetails(loan)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                            >
                              View Details
                            </button>
                        </td>
                      </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* Loan Details Modal */}
        {showDetails && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-slate-800 border-slate-700">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Loan Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Company</label>
                    <p className="mt-1 text-sm text-white">{getCompanyName(selectedLoan.company_id)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Principal Amount</label>
                    <p className="mt-1 text-sm text-white">{formatCurrency(selectedLoan.principal)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Interest Rate</label>
                    <p className="mt-1 text-sm text-white">{selectedLoan.interest_rate}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Term</label>
                    <p className="mt-1 text-sm text-white">{selectedLoan.term_months} months</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Start Date</label>
                    <p className="mt-1 text-sm text-white">{formatDate(selectedLoan.start_date)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                      {selectedLoan.status}
                    </span>
          </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Created At</label>
                    <p className="mt-1 text-sm text-white">{formatDate(selectedLoan.created_at)}</p>
            </div>
          </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-500"
                  >
                    Close
                  </button>
            </div>
          </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 