"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function RepaymentManagement() {
  const [repayments, setRepayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, loan_id: "", amount: "", due_date: "", status: "unpaid" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Define fetchRepayments with useCallback at the top level
  const fetchRepaymentsCallback = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCompany 
        ? `/api/repayments?company_id=${selectedCompany}`
        : "/api/repayments";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load repayments');
      }
      const data = await res.json();
      setRepayments(data);
    } catch (error) {
      setError("Failed to load repayments");
      console.error("Fetch repayments error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchCompanies();
    fetchLoans();
    fetchRepaymentsCallback();
  }, [router, fetchRepaymentsCallback]);

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-select company if only one result matches
  useEffect(() => {
    if (searchTerm && filteredCompanies.length === 1) {
      setSelectedCompany(filteredCompanies[0].id);
      setSearchTerm(filteredCompanies[0].name);
      setShowDropdown(false);
    }
  }, [filteredCompanies, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  }

  async function fetchLoans() {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      setLoans(data);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
    }
  }

  useEffect(() => {
    fetchRepaymentsCallback();
  }, [fetchRepaymentsCallback]);

  function openForm(repayment = { id: null, loan_id: "", amount: "", due_date: "", status: "unpaid" }) {
    setForm(repayment);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const user = JSON.parse(localStorage.getItem("user"));
    const method = form.id ? "PUT" : "POST";
    const body = { ...form };
    if (form.id) body.id = form.id;
    
    try {
      const res = await fetch("/api/repayments", {
        method,
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save repayment");
      }
      
      setShowForm(false);
    fetchRepaymentsCallback();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete(id) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!window.confirm("Delete this repayment?")) return;
    
    try {
      const res = await fetch("/api/repayments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ id }),
    });
      
      if (!res.ok) {
        throw new Error("Failed to delete repayment");
      }
      
    fetchRepaymentsCallback();
    } catch (error) {
      setError(error.message);
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
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Filter loans by selected company
  const filteredLoans = selectedCompany 
    ? loans.filter(loan => loan.company_id === selectedCompany)
    : loans;

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
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">Repayment Management</h1>
          
          {error && <p className="text-red-300 text-sm text-center mb-4">{error}</p>}
          
          {/* Company Selector and Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <label className="text-white font-semibold text-sm">Filter by Company</label>
              
              {/* Search Bar with Dropdown */}
              <div className="relative search-container">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Search companies..."
                  className="border border-white/30 bg-white/10 rounded px-4 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 min-w-[300px] placeholder-white/60"
                  onClick={() => setShowDropdown(true)}
                />
                
                {/* Dropdown Suggestions */}
                {showDropdown && searchTerm && filteredCompanies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                    {filteredCompanies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setSelectedCompany(company.id);
                          setSearchTerm(company.name);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 text-white border-b border-white/10 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-white/60">{company.industry}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showDropdown && searchTerm && filteredCompanies.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-10 px-4 py-3 text-white/60">
                    No companies found matching &ldquo;{searchTerm}&rdquo;
                  </div>
                )}
              </div>
              
              {/* Traditional Dropdown (fallback) */}
              <select 
                value={selectedCompany} 
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  const selectedCompanyData = companies.find(c => c.id === e.target.value);
                  setSearchTerm(selectedCompanyData ? selectedCompanyData.name : "");
                }}
                className="border border-white/30 bg-white/10 rounded px-4 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 min-w-[300px] [&>option]:bg-slate-800 [&>option]:text-white"
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.industry})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => openForm()} 
              className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold transition-colors"
            >
              Add Repayment
            </button>
          </div>

          {/* Summary Stats */}
          {selectedCompany && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold mb-1">Total Repayments</div>
                <div className="text-xl font-bold">{repayments.length}</div>
              </div>
              <div className="bg-green-400/20 text-green-400 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold mb-1">Paid</div>
                <div className="text-xl font-bold">{repayments.filter(r => r.status === 'paid').length}</div>
              </div>
              <div className="bg-red-400/20 text-red-400 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold mb-1">Unpaid</div>
                <div className="text-xl font-bold">{repayments.filter(r => r.status === 'unpaid').length}</div>
              </div>
              <div className="bg-orange-400/20 text-orange-400 border border-orange-400/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold mb-1">Total Amount</div>
                <div className="text-xl font-bold">{formatCurrency(repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0))}</div>
              </div>
            </div>
          )}
          
          {/* Repayments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Loan Code</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-white">Loading repayments...</td>
                  </tr>
                ) : repayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-white">
                      {selectedCompany ? "No repayments found for this company." : "No repayments found."}
                    </td>
                  </tr>
                ) : (
                  repayments.map(r => (
                    <tr key={r.id} className="border-b border-white/10 text-white hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold">{r.company_name}</div>
                          <div className="text-xs text-white/60">{r.company_industry}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{r.loan_code}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(r.amount)}</td>
                      <td className="py-3 px-4">{formatDate(r.due_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'paid' 
                            ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                            : 'bg-red-400/20 text-red-400 border border-red-400/30'
                        }`}>
                          {r.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openForm(r)} 
                            className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-3 py-1 text-xs font-semibold border border-green-400/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id)} 
                            className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-3 py-1 text-xs font-semibold border border-red-400/30 transition-colors"
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
          
          {/* Add/Edit Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/95 rounded-xl p-6 flex flex-col gap-4 border border-white/20 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit Repayment' : 'Add Repayment'}</h3>
                
                <label className="text-white font-semibold text-sm">
                  Company
                  <select 
                    value={selectedCompany} 
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.industry})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-white font-semibold text-sm">
                  Loan
                  <select 
                    value={form.loan_id} 
                    onChange={e => setForm(f => ({ ...f, loan_id: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="">Select Loan</option>
                    {filteredLoans.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {formatCurrency(l.principal)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-white font-semibold text-sm">
                  Amount
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.amount} 
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                  />
                </label>

                <label className="text-white font-semibold text-sm">
                  Due Date
                  <input 
                    type="date" 
                    value={form.due_date} 
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                  />
                </label>

                <label className="text-white font-semibold text-sm">
                  Status
                  <select 
                    value={form.status} 
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </label>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="submit" 
                    className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 