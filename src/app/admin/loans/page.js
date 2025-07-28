"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoanManagement() {
  const [loans, setLoans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, company_id: "", principal: "", interest_rate: "", term_months: "", start_date: "" });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchLoans();
    fetchCompanies();
  }, [router]);

  async function fetchLoans() {
    try {
      const res = await fetch("/api/loans");
      setLoans(await res.json());
    } catch {
      setError("Failed to load loans");
    }
  }

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      setCompanies(await res.json());
    } catch {}
  }

  function openForm(loan = { id: null, company_id: "", principal: "", interest_rate: "", term_months: "", start_date: "" }) {
    setForm(loan);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const user = JSON.parse(localStorage.getItem("user"));
    const method = form.id ? "PUT" : "POST";
    const body = { ...form, created_by: user.id };
    if (form.id) body.id = form.id;
    const res = await fetch("/api/loans", {
      method,
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Failed to save loan");
      return;
    }
    setShowForm(false);
    fetchLoans();
  }

  async function handleDelete(id) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!window.confirm("Delete this loan?")) return;
    await fetch("/api/loans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ id }),
    });
    fetchLoans();
  }

  function viewDetails(id) {
    router.push(`/admin/loans/${id}`);
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Pattern - Full Screen */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Content - Single view without scrolling */}
      <div className="relative z-10 h-full flex items-center justify-center px-3 py-3">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-4 w-full max-w-7xl h-full max-h-[80vh] flex flex-col">
          <h1 className="text-lg font-bold text-green-400 mb-4 text-center">Loan Management</h1>
          
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => openForm()} className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-3 py-1.5 text-sm font-semibold transition-colors">Add Loan</button>
            {error && <p className="text-red-300 text-sm">{error}</p>}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Code</th>
                  <th className="py-2 px-2">Company</th>
                  <th className="py-2 px-2">Principal</th>
                  <th className="py-2 px-2">Rate</th>
                  <th className="py-2 px-2">Term</th>
                  <th className="py-2 px-2">Start</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id} className="border-b border-white/10 text-white">
                    <td className="py-1.5 px-2">{l.code}</td>
                    <td className="py-1.5 px-2">{companies.find(c => c.id === l.company_id)?.name || l.company_id}</td>
                    <td className="py-1.5 px-2">${l.principal}</td>
                    <td className="py-1.5 px-2">{l.interest_rate}%</td>
                    <td className="py-1.5 px-2">{l.term_months}</td>
                    <td className="py-1.5 px-2">{new Date(l.start_date).toLocaleDateString()}</td>
                    <td className="py-1.5 px-2 flex gap-1">
                      <button onClick={() => viewDetails(l.id)} className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 rounded px-2 py-1 text-xs font-semibold border border-blue-400/30">View</button>
                      <button onClick={() => openForm(l)} className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30">Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-2 py-1 text-xs font-semibold border border-red-400/30">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/90 rounded-xl p-6 flex flex-col gap-3 border border-white/20 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit Loan' : 'Add Loan'}</h3>
                <label className="text-white font-semibold text-sm">Company
                  <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="text-white font-semibold text-sm">Principal
                  <input type="number" value={form.principal} onChange={e => setForm(f => ({ ...f, principal: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Interest Rate (%)
                  <input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Term (months)
                  <input type="number" value={form.term_months} onChange={e => setForm(f => ({ ...f, term_months: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Start Date
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors">Save</button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 