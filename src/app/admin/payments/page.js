"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, repayment_id: "", amount: "", payment_date: "", method: "cash" });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchPayments();
    fetchRepayments();
  }, [router]);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/payments");
      setPayments(await res.json());
    } catch {
      setError("Failed to load payments");
    }
  }

  async function fetchRepayments() {
    try {
      const res = await fetch("/api/repayments");
      setRepayments(await res.json());
    } catch {}
  }

  function openForm(payment = { id: null, repayment_id: "", amount: "", payment_date: "", method: "cash" }) {
    setForm(payment);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const user = JSON.parse(localStorage.getItem("user"));
    const method = form.id ? "PUT" : "POST";
    const body = { ...form };
    if (form.id) body.id = form.id;
    const res = await fetch("/api/payments", {
      method,
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Failed to save payment");
      return;
    }
    setShowForm(false);
    fetchPayments();
  }

  async function handleDelete(id) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!window.confirm("Delete this payment?")) return;
    await fetch("/api/payments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ id }),
    });
    fetchPayments();
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
          <h1 className="text-lg font-bold text-green-400 mb-4 text-center">Payment Management</h1>
          
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => openForm()} className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-3 py-1.5 text-sm font-semibold transition-colors">Add Payment</button>
            {error && <p className="text-red-300 text-sm">{error}</p>}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Repayment ID</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Payment Date</th>
                  <th className="py-2 px-2">Method</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-white/10 text-white">
                    <td className="py-1.5 px-2">{p.repayment_id}</td>
                    <td className="py-1.5 px-2">${p.amount}</td>
                    <td className="py-1.5 px-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="py-1.5 px-2">{p.method}</td>
                    <td className="py-1.5 px-2 flex gap-1">
                      <button onClick={() => openForm(p)} className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-2 py-1 text-xs font-semibold border border-red-400/30">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/90 rounded-xl p-6 flex flex-col gap-3 border border-white/20 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit Payment' : 'Add Payment'}</h3>
                <label className="text-white font-semibold text-sm">Repayment
                  <select value={form.repayment_id} onChange={e => setForm(f => ({ ...f, repayment_id: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="">Select Repayment</option>
                    {repayments.map(r => <option key={r.id} value={r.id}>Repayment {r.id}</option>)}
                  </select>
                </label>
                <label className="text-white font-semibold text-sm">Amount
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Payment Date
                  <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Payment Method
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="online">Online</option>
                  </select>
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