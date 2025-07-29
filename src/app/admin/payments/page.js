"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    company_id: "", 
    company_search: "",
    repayment_id: "", 
    amount: "", 
    payment_date: "", 
    method: "cash",
    payment_type: "specific"
  });
  const [loading, setLoading] = useState(false);
  const [companyRepayments, setCompanyRepayments] = useState([]);
  const router = useRouter();

  // Define fetch functions with useCallback at the top level
  const fetchCompaniesCallback = useCallback(async () => {
    try {
      console.log("🔍 Fetching companies...");
      const res = await fetch("/api/companies");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("✅ Companies fetched:", data.length, "companies");
      setCompanies(data);
    } catch (error) {
      console.error("❌ Failed to fetch companies:", error);
      setError(`Failed to fetch companies: ${error.message}`);
    }
  }, []);

  const fetchCompanyRepaymentsCallback = useCallback(async (companyId) => {
    try {
      const res = await fetch(`/api/repayments?company_id=${companyId}`);
      if (!res.ok) {
        throw new Error('Failed to load company repayments');
      }
      const data = await res.json();
      setCompanyRepayments(data.filter(r => r.status === 'unpaid'));
    } catch (error) {
      console.error("Failed to fetch company repayments:", error);
    }
  }, []);

  const fetchPaymentsCallback = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCompany 
        ? `/api/payments?company_id=${selectedCompany}`
        : "/api/payments";
      console.log('🔍 Fetching payments from:', url);
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log('✅ Fetched payments:', data.length, 'records');
      setPayments(data);
    } catch (error) {
      const errorMsg = `Failed to load payments: ${error.message}`;
      setError(errorMsg);
      console.error("❌ Fetch payments error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  const fetchRepaymentsCallback = useCallback(async () => {
    try {
      const url = selectedCompany 
        ? `/api/repayments?company_id=${selectedCompany}`
        : "/api/repayments";
      console.log('Fetching repayments from:', url);
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load repayments');
      }
      const data = await res.json();
      console.log('Fetched repayments:', data.length, 'records');
      setRepayments(data.filter(r => r.status === 'unpaid'));
    } catch (error) {
      console.error("Failed to fetch repayments:", error);
    }
  }, [selectedCompany]);

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchCompaniesCallback();
    fetchPaymentsCallback();
    fetchRepaymentsCallback();
  }, [router, fetchCompaniesCallback, fetchPaymentsCallback, fetchRepaymentsCallback]);

  useEffect(() => {
    if (selectedCompany) {
      fetchPaymentsCallback();
      fetchRepaymentsCallback();
    } else {
      fetchPaymentsCallback();
      fetchRepaymentsCallback();
    }
  }, [selectedCompany, fetchPaymentsCallback, fetchRepaymentsCallback]);

  // Calculate payment statistics
  const paymentStats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    thisMonth: payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    }).length,
    averageAmount: payments.length > 0 ? 
      payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / payments.length : 0
  };

  // Calculate unpaid amounts for each company
  const companiesWithUnpaidAmounts = (companies || []).map(company => {
    return {
      ...company,
      unpaidAmount: parseFloat(company.unpaid_amount || 0),
      unpaidCount: parseInt(company.payments_left || 0)
    };
  });

  // Filter companies based on search term
  const filteredCompanies = companiesWithUnpaidAmounts.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected company data
  const selectedCompanyData = companiesWithUnpaidAmounts.find(c => c.id === selectedCompany);

  // Auto-select company if only one result matches
  useEffect(() => {
    if (searchTerm && filteredCompanies.length === 1 && !selectedCompany) {
      setSelectedCompany(filteredCompanies[0].id);
      setSearchTerm(filteredCompanies[0].name);
      setShowDropdown(false);
    }
  }, [filteredCompanies, searchTerm, selectedCompany]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowDropdown(false);
      }
      if (!event.target.closest('.company-search-container')) {
        setForm(f => ({ ...f, company_search: "" }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch company repayments when company is selected in form
  useEffect(() => {
    if (form.company_id) {
      fetchCompanyRepaymentsCallback(form.company_id);
    }
  }, [form.company_id, fetchCompanyRepaymentsCallback]);

  // Show loading state if companies haven't been fetched yet
  if (companies.length === 0 && !loading) {
    return (
      <div className="relative min-h-screen bg-slate-950 pt-20">
        <div className="fixed inset-0 -z-10">
          <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
            <div></div>
          </div>
        </div>
        <div className="relative z-10 px-4 py-3">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mr-3"></div>
              <span className="text-white">Loading payment management...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function openForm(payment = { id: null, company_id: "", repayment_id: "", amount: "", payment_date: "", method: "cash", payment_type: "specific" }) {
    setForm(payment);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    if (!form.company_id) {
      setError("Please select a company from the list");
      return;
    }
    
    if (form.payment_type === "specific") {
      if (!form.repayment_id) {
        setError("Please select a repayment");
        return;
      }
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (!form.payment_date) {
      setError("Please select a payment date");
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log('Submitting payment with form data:', form);
      
      if (form.payment_type === "bulk") {
        console.log('Processing bulk payment...');
        await handleBulkPayment(user);
      } else {
        console.log('Processing single payment...');
        await handleSpecificPayment(user);
      }
      
      console.log('Payment processed successfully');
      setShowForm(false);
      fetchPaymentsCallback();
      fetchRepaymentsCallback();
    } catch (error) {
      console.error('Payment submission error:', error);
      setError(error.message);
    }
  }

  async function handleSpecificPayment(user) {
    const method = form.id ? "PUT" : "POST";
    const body = { ...form };
    if (form.id) body.id = form.id;
    
    console.log('Sending single payment request:', { method, body });
    
    const res = await fetch("/api/payments", {
      method,
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    
    console.log('Payment response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Payment API error:', errorData);
      throw new Error(errorData.error || "Failed to save payment");
    }
    
    const result = await res.json();
    console.log('Payment created successfully:', result);
  }

  async function handleBulkPayment(user) {
    const remainingAmount = parseFloat(form.amount);
    let currentAmount = remainingAmount;
    const paymentsToCreate = [];

    console.log('Processing bulk payment for amount:', remainingAmount);
    console.log('Available repayments:', companyRepayments.length);

    const sortedRepayments = [...companyRepayments].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    for (const repayment of sortedRepayments) {
      if (currentAmount <= 0) break;
      
      const repaymentAmount = parseFloat(repayment.amount);
      const paymentAmount = Math.min(currentAmount, repaymentAmount);
      
      paymentsToCreate.push({
        repayment_id: repayment.id,
        amount: paymentAmount,
        payment_date: form.payment_date,
        method: form.method
      });
      
      currentAmount -= paymentAmount;
      console.log(`Allocated ${paymentAmount} to repayment ${repayment.id}, remaining: ${currentAmount}`);
    }

    console.log('Payments to create:', paymentsToCreate);

    if (paymentsToCreate.length === 0) {
      throw new Error("No repayments available for payment");
    }

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ payments: paymentsToCreate }),
    });
    
    console.log('Bulk payment response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Bulk payment API error:', errorData);
      throw new Error(errorData.error || "Failed to create bulk payment");
    }
    
    const result = await res.json();
    console.log('Bulk payment created successfully:', result);
  }

  async function handleDelete(id) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!window.confirm("Delete this payment?")) return;
      
      const res = await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-user-role": user.role },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete payment");
      }
      
      fetchPaymentsCallback();
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

  function getMethodBadge(method) {
    const badges = {
      cash: "bg-green-500/20 text-green-400 border-green-500/30",
      bank_transfer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      check: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      online: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };
    return badges[method] || badges.cash;
  }

  return (
    <div className="relative min-h-screen bg-slate-950 pt-20">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-4 py-3">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">Payment Management</h1>
          
          {error && <p className="text-red-300 text-sm text-center mb-4">{error}</p>}
          
          {/* Payment Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Total Payments</div>
              <div className="text-xl font-bold">{paymentStats.total}</div>
            </div>
            <div className="bg-green-400/20 text-green-400 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Total Amount</div>
              <div className="text-xl font-bold">{formatCurrency(paymentStats.totalAmount)}</div>
            </div>
            <div className="bg-purple-400/20 text-purple-400 border border-purple-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">This Month</div>
              <div className="text-xl font-bold">{paymentStats.thisMonth}</div>
            </div>
            <div className="bg-orange-400/20 text-orange-400 border border-orange-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Average Amount</div>
              <div className="text-xl font-bold">{formatCurrency(paymentStats.averageAmount)}</div>
            </div>
          </div>

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
                    if (!e.target.value) {
                      setSelectedCompany("");
                    }
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
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-white">{company.name}</div>
                            <div className="text-sm text-white/60">{company.industry}</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold text-red-400">
                              {company.unpaidCount || 0} payments left
                            </div>
                            <div className="text-xs text-red-400">
                              {formatCurrency(company.unpaidAmount || 0)}
                            </div>
                          </div>
                        </div>
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
              
              {/* Selected Company Display */}
              {selectedCompanyData && (
                <div className="border border-white/30 bg-white/10 rounded px-4 py-2 text-white backdrop-blur-sm min-w-[300px]">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-white">{selectedCompanyData.name}</div>
                      <div className="text-sm text-white/60">{selectedCompanyData.industry}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-red-400">
                        {selectedCompanyData.unpaidCount} payments left
                      </div>
                      <div className="text-xs text-red-400">
                        {formatCurrency(selectedCompanyData.unpaidAmount)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCompany("");
                        setSearchTerm("");
                      }}
                      className="ml-2 text-white/60 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => openForm()} 
              className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold transition-colors"
            >
              Add Payment
            </button>
          </div>
          
          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Loan Code</th>
                  <th className="py-3 px-4">Repayment Due</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-white">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mr-3"></div>
                        Loading payments...
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-white/60">
                      {selectedCompany ? "No payments found for this company." : "No payments found."}
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="border-b border-white/10 text-white hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold">{p.company_name}</div>
                          <div className="text-xs text-white/60">{p.company_industry}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{p.loan_code}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{formatDate(p.due_date)}</div>
                          <div className="text-xs text-white/60">{formatCurrency(p.repayment_amount)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getMethodBadge(p.method)}`}>
                          {p.method.replace('_', ' ').charAt(0).toUpperCase() + p.method.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openForm(p)} 
                            className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-3 py-1 text-xs font-semibold border border-green-400/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
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
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/95 rounded-xl p-6 flex flex-col gap-4 border border-white/20 max-w-lg w-full mx-4 shadow-2xl">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit Payment' : 'Add Payment'}</h3>
                
                {/* Payment Type Selection */}
                {!form.id && (
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="specific"
                        checked={form.payment_type === "specific"}
                        onChange={(e) => setForm(f => ({ ...f, payment_type: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-white text-sm">Specific Repayment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="bulk"
                        checked={form.payment_type === "bulk"}
                        onChange={(e) => setForm(f => ({ ...f, payment_type: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-white text-sm">Bulk Payment</span>
                    </label>
                  </div>
                )}

                {/* Company Selection */}
                <label className="text-white font-semibold text-sm">
                  Company
                  <div className="relative mt-1 company-search-container">
                    <input
                      type="text"
                      value={form.company_search || ""}
                      onChange={(e) => {
                        setForm(f => ({ ...f, company_search: e.target.value }));
                        setForm(f => ({ ...f, company_id: "" }));
                      }}
                      placeholder={form.company_id ? "Company selected" : "Search companies..."}
                      className={`border rounded px-3 py-2 w-full text-white backdrop-blur-sm focus:outline-none placeholder-white/60 ${
                        form.company_id 
                          ? "border-green-400 bg-green-400/10" 
                          : "border-white/30 bg-white/10 focus:border-green-400/50"
                      }`}
                    />
                    
                    {/* Selected company indicator */}
                    {form.company_id && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Company Search Dropdown */}
                    {form.company_search && !form.company_id && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                        {companiesWithUnpaidAmounts
                          .filter(company => 
                            company.name.toLowerCase().includes(form.company_search.toLowerCase()) ||
                            company.industry.toLowerCase().includes(form.company_search.toLowerCase())
                          )
                          .map(company => (
                            <button
                              key={company.id}
                              onClick={() => {
                                setForm(f => ({ 
                                  ...f, 
                                  company_id: company.id, 
                                  company_search: company.name 
                                }));
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-white/10 text-white border-b border-white/10 last:border-b-0 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-white">{company.name}</div>
                                  <div className="text-sm text-white/60">{company.industry}</div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-sm font-semibold text-red-400">
                                    {company.unpaidCount} payments left
                                  </div>
                                  <div className="text-xs text-red-400">
                                    {formatCurrency(company.unpaidAmount)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        
                        {/* No results message */}
                        {companiesWithUnpaidAmounts.filter(company => 
                          company.name.toLowerCase().includes(form.company_search.toLowerCase()) ||
                          company.industry.toLowerCase().includes(form.company_search.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-3 text-white/60 text-center">
                            No companies found matching &ldquo;{form.company_search}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Clear button when company is selected */}
                    {form.company_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(f => ({ 
                            ...f, 
                            company_id: "", 
                            company_search: "",
                            repayment_id: "" 
                          }));
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </label>

                {/* Specific Repayment Selection */}
                {form.payment_type === "specific" && form.company_id && (
                  <label className="text-white font-semibold text-sm">
                    Repayment
                    <select 
                      value={form.repayment_id} 
                      onChange={e => {
                        const repayment = companyRepayments.find(r => r.id === e.target.value);
                        setForm(f => ({ 
                          ...f, 
                          repayment_id: e.target.value,
                          amount: repayment ? repayment.amount : ""
                        }));
                      }} 
                      required 
                      className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Select Repayment</option>
                      {companyRepayments.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.loan_code} - {formatCurrency(r.amount)} (Due: {formatDate(r.due_date)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Bulk Payment Info */}
                {form.payment_type === "bulk" && form.company_id && (
                  <div className="bg-blue-400/20 border border-blue-400/30 rounded-lg p-3">
                    <div className="text-blue-400 text-sm font-semibold mb-2">Bulk Payment Info</div>
                    <div className="text-white text-xs">
                      <div>Total Unpaid: {formatCurrency(companyRepayments.reduce((sum, r) => sum + parseFloat(r.amount), 0))}</div>
                      <div>Number of Repayments: {companyRepayments.length}</div>
                      <div className="mt-2 text-blue-300">
                        Amount will be automatically deducted from repayments in order of due date (earliest first).
                      </div>
                    </div>
                  </div>
                )}

                <label className="text-white font-semibold text-sm">
                  Amount
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.amount} 
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    placeholder={form.payment_type === "bulk" ? "Enter total amount to deduct" : "Enter amount"}
                  />
                </label>

                <label className="text-white font-semibold text-sm">
                  Payment Date
                  <input 
                    type="date" 
                    value={form.payment_date} 
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                  />
                </label>

                <label className="text-white font-semibold text-sm">
                  Payment Method
                  <select 
                    value={form.method} 
                    onChange={e => setForm(f => ({ ...f, method: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="online">Online</option>
                  </select>
                </label>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="submit" 
                    className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors"
                  >
                    {form.id ? 'Update Payment' : form.payment_type === "bulk" ? 'Create Bulk Payment' : 'Create Payment'}
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