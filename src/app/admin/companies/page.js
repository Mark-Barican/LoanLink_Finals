"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import components to avoid prerendering issues
const AdminNavbar = dynamic(() => import("../AdminNavbar"), { ssr: false });

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({ 
    id: null, 
    name: "", 
    industry: "", 
    address: "", 
    tin: "", 
    contact_person: "",
    phone: "",
    email: ""
  });
  const router = useRouter();

  const companiesPerPage = 10;

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "admin") {
      router.replace("/auth");
      return;
    }
    fetchCompanies();
  }, [router]);

  async function fetchCompanies() {
    try {
      setError("");
      const res = await fetch("/api/companies");
      if (!res.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await res.json();
      // Remove duplicates based on company ID
      const uniqueCompanies = data.filter((company, index, self) => 
        index === self.findIndex(c => c.id === company.id)
      );
      setCompanies(uniqueCompanies);
    } catch (err) {
      console.error('Fetch companies error:', err);
      setError("Failed to load companies");
    }
  }

  function openForm(company = null) {
    if (company) {
      setForm({
        id: company.id,
        name: company.name || "",
        industry: company.industry || "",
        address: company.address || "",
        tin: company.tin || "",
        contact_person: company.contact_person || "",
        phone: company.phone || "",
        email: company.email || ""
      });
    } else {
      setForm({
        id: null,
        name: "",
        industry: "",
        address: "",
        tin: "",
        contact_person: "",
        phone: "",
        email: ""
      });
    }
    setError("");
  }

  function clearForm() {
    setForm({
      id: null,
      name: "",
      industry: "",
      address: "",
      tin: "",
      contact_person: "",
      phone: "",
      email: ""
    });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      const companyData = { ...form };

      const url = form.id ? `/api/companies/${form.id}` : "/api/companies";
      const method = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": user.role
        },
        body: JSON.stringify(companyData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${form.id ? 'update' : 'create'} company`);
      }

      await fetchCompanies();
      clearForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || `Failed to ${form.id ? 'update' : 'create'} company`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this company?")) return;
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`/api/companies/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Failed to delete company");
      await fetchCompanies();
    } catch (err) {
      console.error('Delete error:', err);
      setError("Failed to delete company");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function getIndustryColor(industry) {
    const colors = {
      'Technology': 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      'Finance': 'bg-green-500/20 text-green-400 border-green-400/30',
      'Healthcare': 'bg-red-500/20 text-red-400 border-red-400/30',
      'Manufacturing': 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
      'Retail': 'bg-purple-500/20 text-purple-400 border-purple-400/30',
      'Real Estate': 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30',
      'Education': 'bg-pink-500/20 text-pink-400 border-pink-400/30',
      'Transportation': 'bg-orange-500/20 text-orange-400 border-orange-400/30',
      'Energy': 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
      'Consulting': 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
      'Renewable Energy': 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
      'Entertainment': 'bg-gray-500/20 text-gray-400 border-gray-400/30'
    };
    return colors[industry] || 'bg-gray-500/20 text-gray-400 border-gray-400/30';
  }

  // Pagination calculations
  const totalPages = Math.ceil(companies.length / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const currentCompanies = companies.slice(startIndex, endIndex);

  function goToPage(page) {
    setCurrentPage(page);
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Manufacturing",
    "Retail",
    "Real Estate",
    "Education",
    "Transportation",
    "Energy",
    "Renewable Energy",
    "Consulting",
    "Entertainment",
    "Other"
  ];

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <AdminNavbar currentPage="companies" />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-blue-400/5 to-orange-400/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-6 pt-24">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">Company Management</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Side-by-side Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Form Section - Left Side */}
            <div className="xl:col-span-1">
              <div className="backdrop-blur-md bg-slate-900/50 rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span>{form.id ? 'Edit Company' : 'Add New Company'}</span>
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
                    <label className="text-white font-semibold text-sm block mb-2">Company Name</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                      required 
                      placeholder="Enter company name"
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Industry</label>
                    <select 
                      value={form.industry} 
                      onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} 
                      required 
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Select Industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Address</label>
                    <textarea 
                      value={form.address} 
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                      required 
                      placeholder="Enter company address"
                      rows="3"
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50 resize-none" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white font-semibold text-sm block mb-2">TIN</label>
                      <input 
                        type="text" 
                        value={form.tin} 
                        onChange={e => setForm(f => ({ ...f, tin: e.target.value }))} 
                        required 
                        placeholder="Tax ID"
                        className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-white font-semibold text-sm block mb-2">Phone</label>
                      <input 
                        type="tel" 
                        value={form.phone} 
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
                        placeholder="Phone number"
                        className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Contact Person</label>
                    <input 
                      type="text" 
                      value={form.contact_person} 
                      onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} 
                      required 
                      placeholder="Contact person name"
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-white font-semibold text-sm block mb-2">Email</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                      placeholder="Contact email"
                      className="w-full border border-white/30 bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    />
                  </div>
                  
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
            <div className="xl:col-span-3">
              <div className="backdrop-blur-md bg-slate-900/50 rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-green-400">Companies ({companies.length})</h2>
                  <div className="text-sm text-white/60">
                    {companies.length === 0 ? "No companies found" : `Showing ${startIndex + 1}-${Math.min(endIndex, companies.length)} of ${companies.length} companies`}
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                      <tr className="text-green-400 border-b border-white/20">
                        <th className="py-3 px-3 w-1/6">Company</th>
                        <th className="py-3 px-3 w-1/8">Industry</th>
                        <th className="py-3 px-3 w-1/5">Contact</th>
                        <th className="py-3 px-3 w-1/8">TIN</th>
                        <th className="py-3 px-3 w-1/8">Phone</th>
                        <th className="py-3 px-3 w-1/8">Created</th>
                        <th className="py-3 px-3 w-1/8">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCompanies.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-white/60">
                            {companies.length === 0 ? "No companies found. Use the form to create your first company." : "No companies on this page."}
                          </td>
                        </tr>
                      ) : (
                        currentCompanies.map(c => (
                          <tr key={c.id} className="border-b border-white/10 text-white hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3">
                              <div>
                                <div className="font-semibold text-white whitespace-nowrap">{c.name}</div>
                                {c.email && (
                                  <div className="text-xs text-white/60 mt-1 truncate">{c.email}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {c.industry && (
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getIndustryColor(c.industry)} whitespace-nowrap`}>
                                  {c.industry}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div>
                                <div className="font-medium text-white whitespace-nowrap">{c.contact_person}</div>
                                <div className="text-xs text-white/60 mt-1 truncate max-w-48">{c.address}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono text-sm text-white whitespace-nowrap">{c.tin}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-white whitespace-nowrap">{c.phone || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs text-white/70 whitespace-nowrap">{formatDate(c.created_at)}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openForm(c)} 
                                  className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30 transition-colors"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDelete(c.id)} 
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col items-center gap-4">
                    {/* Page Info */}
                    <div className="text-sm text-white/60">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page Dots */}
                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => goToPage(index + 1)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              currentPage === index + 1
                                ? 'bg-green-400'
                                : 'bg-white/20 hover:bg-white/30'
                            }`}
                            title={`Page ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 