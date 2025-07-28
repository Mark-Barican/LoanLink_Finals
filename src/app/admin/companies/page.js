"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", industry: "", address: "", tin: "", contact_person: "" });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchCompanies(user.role);
  }, [router]);

  async function fetchCompanies(role) {
    try {
      const res = await fetch("/api/companies");
      setCompanies(await res.json());
    } catch {
      setError("Failed to load companies");
    }
  }

  function openForm(company = { id: null, name: "", industry: "", address: "", tin: "", contact_person: "" }) {
    setForm(company);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const user = JSON.parse(localStorage.getItem("user"));
    const method = form.id ? "PUT" : "POST";
    const body = { ...form };
    if (form.id) body.id = form.id;
    const res = await fetch("/api/companies", {
      method,
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Failed to save company");
      return;
    }
    setShowForm(false);
    fetchCompanies(user.role);
  }

  async function handleDelete(id) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!window.confirm("Delete this company?")) return;
    await fetch("/api/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ id }),
    });
    fetchCompanies(user.role);
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
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-4 w-full max-w-6xl h-full max-h-[80vh] flex flex-col">
          <h1 className="text-lg font-bold text-green-400 mb-4 text-center">Company Management</h1>
          
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => openForm()} className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-3 py-1.5 text-sm font-semibold transition-colors">Add Company</button>
            {error && <p className="text-red-300 text-sm">{error}</p>}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Industry</th>
                  <th className="py-2 px-2">Address</th>
                  <th className="py-2 px-2">TIN</th>
                  <th className="py-2 px-2">Contact</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} className="border-b border-white/10 text-white">
                    <td className="py-1.5 px-2">{c.name}</td>
                    <td className="py-1.5 px-2">{c.industry}</td>
                    <td className="py-1.5 px-2">{c.address}</td>
                    <td className="py-1.5 px-2">{c.tin}</td>
                    <td className="py-1.5 px-2">{c.contact_person}</td>
                    <td className="py-1.5 px-2 flex gap-1">
                      <button onClick={() => openForm(c)} className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-2 py-1 text-xs font-semibold border border-red-400/30">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/90 rounded-xl p-6 flex flex-col gap-3 border border-white/20 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit Company' : 'Add Company'}</h3>
                <label className="text-white font-semibold text-sm">Name
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Industry
                  <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Address
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" rows="2" />
                </label>
                <label className="text-white font-semibold text-sm">TIN
                  <input type="text" value={form.tin} onChange={e => setForm(f => ({ ...f, tin: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Contact Person
                  <input type="text" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
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