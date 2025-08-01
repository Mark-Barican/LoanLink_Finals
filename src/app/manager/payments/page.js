"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ManagerNavbar from "../ManagerNavbar";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    loan_id: "", 
    amount: "", 
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank_transfer",
    notes: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "manager") {
      router.replace("/auth");
      return;
    }
    fetchPayments(1);
    fetchLoans();
  }, [router]);

  async function fetchPayments(page = 1) {
    try {
      setError("");
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch(`/api/payments?page=${page}&limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'manager'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch payments');
      }
      const responseData = await res.json();
      setPayments(Array.isArray(responseData.data) ? responseData.data : []);
      setPagination(responseData.pagination);
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError("Failed to load payments");
    }
  }

  async function fetchLoans() {
    try {
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

  function openForm(payment = null) {
    if (payment) {
      setForm({
        id: payment.id,
        loan_id: payment.loan_id || "",
        amount: payment.amount || "",
        payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        payment_method: payment.payment_method || "bank_transfer",
        notes: payment.notes || ""
      });
    } else {
      setForm({
        id: null,
        loan_id: "",
        amount: "",
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "bank_transfer",
        notes: ""
      });
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({
      id: null,
      loan_id: "",
      amount: "",
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "bank_transfer",
      notes: ""
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const url = form.id ? `/api/payments/${form.id}` : "/api/payments";
      const method = form.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || 'manager'
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save payment');
      }

      await fetchPayments();
      closeForm();
    } catch (err) {
      console.error('Save payment error:', err);
      setError(err.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      setError("");
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || 'manager'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete payment');
      }

      await fetchPayments();
    } catch (err) {
      console.error('Delete payment error:', err);
      setError("Failed to delete payment");
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getLoanDetails(loanId) {
    const loan = loans.find(l => l.id === loanId);
    return loan ? `${loan.company_name} - ${formatCurrency(loan.principal)}` : "Unknown Loan";
  }

  function getPaymentMethodLabel(method) {
    const methods = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      online: "Online Payment"
    };
    return methods[method] || method;
  }

  // Pagination functions
  const handlePageChange = (newPage) => {
    fetchPayments(newPage);
  };

  const renderPaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (pagination.hasPrevPage) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            i === pagination.currentPage
              ? 'bg-blue-400 text-white'
              : 'text-white bg-white/10 hover:bg-white/20'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (pagination.hasNextPage) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-white/60">
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount} payments
        </div>
        <div className="flex items-center gap-2">
          {pages}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <ManagerNavbar currentPage="payments" />
      <div className="pt-20 p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 mb-1">Payment Management</h1>
            <p className="text-white/60 text-sm">Track and manage loan payments</p>
          </div>
          <button
            onClick={() => openForm()}
            className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Payment
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Payments</p>
                <p className="text-green-400 text-2xl font-bold">
                  {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                </p>
              </div>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Payment Count</p>
                <p className="text-blue-400 text-2xl font-bold">{pagination.totalCount}</p>
              </div>
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">This Month</p>
                <p className="text-purple-400 text-2xl font-bold">
                  {formatCurrency(payments
                    .filter(p => new Date(p.payment_date).getMonth() === new Date().getMonth())
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  )}
                </p>
              </div>
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-white/60 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Loan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">{getLoanDetails(payment.loan_id)}</td>
                      <td className="px-4 py-3 font-semibold text-green-400">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {payment.notes || "No notes"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openForm(payment)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/60">No payments found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {renderPaginationControls()}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {form.id ? "Edit Payment" : "Record Payment"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Loan
                  </label>
                  <select
                    value={form.loan_id}
                    onChange={(e) => setForm({...form, loan_id: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                    required
                  >
                    <option value="">Select a loan</option>
                    {loans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.company_name} - {formatCurrency(loan.principal)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="Enter payment amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm({...form, payment_date: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({...form, payment_method: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                    placeholder="Optional notes about the payment"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    {loading ? "Saving..." : (form.id ? "Update" : "Record")}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 