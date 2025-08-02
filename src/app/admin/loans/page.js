"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import components to avoid prerendering issues
const AdminNavbar = dynamic(() => import("../AdminNavbar"), { ssr: false });

export default function LoanManagement() {
  const [loans, setLoans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    company_id: "", 
    principal: "", 
    interest_rate: "", 
    term_months: "", 
    start_date: new Date().toISOString().slice(0, 10),
    status: "active"
  });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "admin") {
      router.replace("/auth");
      return;
    }
    fetchLoans();
    fetchCompanies();
    fetchUsers();
  }, [router]);

  async function fetchLoans() {
    try {
      setError("");
      const res = await fetch("/api/loans");
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
      const res = await fetch("/api/companies");
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

  async function fetchUsers() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/api/users", {
        headers: {
          "x-user-role": user.role
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users error:', err);
      // Don't set error for users fetch as it's not critical
    }
  }

  function openForm(loan = null) {
    if (loan) {
      setForm({
        id: loan.id,
        company_id: loan.company_id || "",
        principal: loan.principal || "",
        interest_rate: loan.interest_rate || "",
        term_months: loan.term_months || "",
        start_date: loan.start_date ? new Date(loan.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: loan.status || "active"
      });
    } else {
      setForm({
        id: null,
        company_id: "",
        principal: "",
        interest_rate: "",
        term_months: "",
        start_date: new Date().toISOString().slice(0, 10),
        status: "active"
      });
    }
    setError("");
  }

  function clearForm() {
    setForm({
      id: null,
      company_id: "",
      principal: "",
      interest_rate: "",
      term_months: "",
      start_date: new Date().toISOString().slice(0, 10),
      status: "active"
    });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log('User from localStorage:', user);
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      if (!user.id) {
        setError("User ID not found. Please log in again.");
        return;
      }

      const loanData = {
        ...form,
        created_by: user.id
      };

      const url = form.id ? `/api/loans/${form.id}` : "/api/loans";
      const method = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": user.role
        },
        body: JSON.stringify(loanData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${form.id ? 'update' : 'create'} loan`);
      }

      await fetchLoans();
      clearForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || `Failed to ${form.id ? 'update' : 'create'} loan`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this loan?")) return;
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`/api/loans/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Failed to delete loan");
      await fetchLoans();
    } catch (err) {
      console.error('Delete error:', err);
      setError("Failed to delete loan");
    }
  }

  function viewDetails(id) {
    router.push(`/admin/loans/${id}`);
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function formatCurrency(amount) {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <AdminNavbar currentPage="loans" />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-blue-400/5 to-orange-400/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-6 pt-24">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">Loan Management</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Side-by-side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section - Left Side */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-md bg-slate-900/50 rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span>{form.id ? 'Edit Loan' : 'Add New Loan'}</span>
                  {form.id && (
                    <button 
                      onClick={clearForm}
                      className="text-xs bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1 transition-colors"
                    >
                      New
                    </button>
                  )}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Company</label>
                    <select 
                      value={form.company_id} 
                      onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} 
                      required 
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Principal Amount</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.principal} 
                      onChange={e => setForm(f => ({ ...f, principal: parseFloat(e.target.value).toFixed(2) }))} 
                      required 
                      placeholder="Enter loan amount (e.g., 100000.00)"
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white font-semibold text-sm block mb-2">Interest Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.interest_rate} 
                        onChange={e => setForm(f => ({ ...f, interest_rate: parseFloat(e.target.value).toFixed(2) }))} 
                        required 
                        placeholder="Rate (e.g., 12.00)"
                        className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-white font-semibold text-sm block mb-2">Term (months)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="360"
                        value={form.term_months} 
                        onChange={e => setForm(f => ({ ...f, term_months: e.target.value }))} 
                        required 
                        placeholder="Months"
                        className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={form.start_date} 
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} 
                      required 
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    />
                  </div>

                  {form.id && (
                    <div>
                      <label className="text-white font-semibold text-sm block mb-2">Status</label>
                      <select 
                        value={form.status} 
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
                        className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="defaulted">Defaulted</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 bg-green-400 hover:bg-green-300 disabled:bg-green-400/50 text-slate-900 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {loading ? 'Saving...' : (form.id ? 'Update' : 'Create')}
                    </button>
                    {form.id && (
                      <button 
                        type="button" 
                        onClick={clearForm}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Table Section - Right Side */}
            <div className="lg:col-span-2">
              <div className="backdrop-blur-md bg-slate-900/50 rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-green-400">Loans ({loans.length})</h2>
                  <div className="text-sm text-white/60">
                    {loans.length === 0 ? "No loans found" : `${loans.length} loan${loans.length === 1 ? '' : 's'} total`}
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                      <tr className="text-green-400 border-b border-white/20">
                        <th className="py-3 px-3">Code</th>
                        <th className="py-3 px-3">Company</th>
                        <th className="py-3 px-3">Principal</th>
                        <th className="py-3 px-3">Interest</th>
                        <th className="py-3 px-3">Total Amount</th>
                        <th className="py-3 px-3">Rate</th>
                        <th className="py-3 px-3">Term</th>
                        <th className="py-3 px-3">Start Date</th>
                        <th className="py-3 px-3">Created By</th>
                        <th className="py-3 px-3">Created At</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="text-center py-8 text-white/60">
                            No loans found. Use the form to create your first loan.
                          </td>
                        </tr>
                      ) : (
                        loans.map(l => (
                          <tr key={l.id} className="border-b border-white/10 text-white hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 font-mono text-green-400">{l.code}</td>
                            <td className="py-3 px-3">{companies.find(c => c.id === l.company_id)?.name || 'Unknown Company'}</td>
                            <td className="py-3 px-3">{formatCurrency(l.principal)}</td>
                            <td className="py-3 px-3 text-orange-400">{formatCurrency(l.total_interest || 0)}</td>
                            <td className="py-3 px-3 font-semibold text-green-400">{formatCurrency(l.total_amount || l.principal)}</td>
                            <td className="py-3 px-3">{l.interest_rate}%</td>
                            <td className="py-3 px-3">{l.term_months} months</td>
                            <td className="py-3 px-3">{formatDate(l.start_date)}</td>
                            <td className="py-3 px-3">
                              {users.find(u => u.id === l.created_by)?.name || 'Unknown User'}
                            </td>
                            <td className="py-3 px-3 text-xs">{formatDate(l.created_at)}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                l.status === 'active' ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 
                                l.status === 'completed' ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30' : 
                                l.status === 'defaulted' ? 'bg-red-400/20 text-red-400 border border-red-400/30' :
                                'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => viewDetails(l.id)} 
                                  className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 rounded px-2 py-1 text-xs font-semibold border border-blue-400/30 transition-colors"
                                >
                                  View
                                </button>
                                <button 
                                  onClick={() => openForm(l)} 
                                  className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30 transition-colors"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDelete(l.id)} 
                                  className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-2 py-1 text-xs font-semibold border border-red-400/30 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 