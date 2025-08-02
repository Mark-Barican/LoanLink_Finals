"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LoanDetails({ params }) {
  const { id } = params;
  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ repayment_id: "", amount: "", payment_date: "", method: "cash" });
  const router = useRouter();

  const fetchLoan = useCallback(async () => {
    try {
      const res = await fetch(`/api/loans`);
      const loans = await res.json();
      setLoan(loans.find(l => l.id === id));
    } catch {
      setError("Failed to load loan");
    }
  }, [id]);

  const fetchRepayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/repayments?loan_id=${id}`);
      const responseData = await res.json();
      setRepayments(responseData.data || []);
    } catch {
      setError("Failed to load repayments");
    }
  }, [id]);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments`);
      const responseData = await res.json();
      setPayments(responseData.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      router.replace("/auth");
      return;
    }
    fetchLoan();
    fetchRepayments();
    fetchPayments();
  }, [id, router, fetchLoan, fetchRepayments, fetchPayments]);

  async function markRepaymentPaid(rid) {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/api/repayments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ id: rid, status: "paid" }),
    });
    fetchRepayments();
  }

  function openPaymentForm(repayment_id) {
    setPaymentForm({ repayment_id, amount: "", payment_date: new Date().toISOString().slice(0, 10), method: "cash" });
    setShowPaymentForm(true);
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    setError("");
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": user.role },
      body: JSON.stringify({ ...paymentForm, created_by: user.id }),
    });
    if (!res.ok) {
      setError("Failed to record payment");
      return;
    }
    setShowPaymentForm(false);
    fetchPayments();
    fetchRepayments();
  }

  return (
    <div className="relative min-h-screen bg-slate-950 pt-20">
      {/* Background Pattern - Full Screen */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Content - Single view without scrolling */}
      <div className="relative z-10 flex items-center justify-center px-3 py-3">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-4 w-full max-w-6xl h-full max-h-[80vh] flex flex-col overflow-auto">
          <h1 className="text-lg font-bold text-green-400 mb-4 text-center">Loan Details</h1>
          {error && <p className="text-red-300 text-sm text-center mb-3">{error}</p>}
          
          {loan && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-white">
                <div><span className="text-green-400 font-semibold">Code:</span> {loan.code}</div>
                <div><span className="text-green-400 font-semibold">Principal:</span> ₱{parseFloat(loan.principal).toFixed(2)}</div>
                <div><span className="text-orange-400 font-semibold">Total Interest:</span> ₱{parseFloat(loan.total_interest || 0).toFixed(2)}</div>
                <div><span className="text-green-400 font-semibold">Total Amount:</span> ₱{parseFloat(loan.total_amount || loan.principal).toFixed(2)}</div>
                <div><span className="text-green-400 font-semibold">Interest Rate:</span> {loan.interest_rate}%</div>
                <div><span className="text-green-400 font-semibold">Term:</span> {loan.term_months} months</div>
                <div><span className="text-green-400 font-semibold">Status:</span> {loan.status}</div>
                <div><span className="text-green-400 font-semibold">Start Date:</span> {loan.start_date}</div>
              </div>
              <div className="mt-3 p-2 bg-green-400/10 rounded border border-green-400/20">
                <p className="text-xs text-green-400">
                  <strong>Philippine Add-On Interest Method:</strong> Total Interest = Principal × {loan.interest_rate}% × {loan.term_months/12} years = ₱{parseFloat(loan.total_interest || 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          
          <h2 className="text-sm font-bold text-green-400 mb-2">Repayment Schedule</h2>
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Due Date</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map(r => (
                  <tr key={r.id} className="border-b border-white/10 text-white">
                    <td className="py-1.5 px-2">{r.due_date}</td>
                    <td className="py-1.5 px-2">₱{parseFloat(r.amount).toFixed(2)}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'paid' ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-red-400/20 text-red-400 border border-red-400/30'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      {r.status === 'unpaid' && (
                        <div className="flex gap-1">
                          <button onClick={() => markRepaymentPaid(r.id)} className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30">
                            Mark Paid
                          </button>
                          <button onClick={() => openPaymentForm(r.id)} className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 rounded px-2 py-1 text-xs font-semibold border border-blue-400/30">
                            Record Payment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h2 className="text-sm font-bold text-green-400 mb-2">Payments</h2>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Repayment</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Payment Date</th>
                  <th className="py-2 px-2">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.filter(p => repayments.some(r => r.id === p.repayment_id)).map(p => (
                  <tr key={p.id} className="border-b border-white/10 text-white">
                    <td className="py-1.5 px-2">{repayments.find(r => r.id === p.repayment_id)?.due_date || "-"}</td>
                    <td className="py-1.5 px-2">₱{parseFloat(p.amount).toFixed(2)}</td>
                    <td className="py-1.5 px-2">{p.payment_date}</td>
                    <td className="py-1.5 px-2">{p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showPaymentForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handlePaymentSubmit} className="backdrop-blur-md bg-slate-900/90 rounded-xl p-6 flex flex-col gap-3 border border-white/20 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">Record Payment</h3>
                <label className="text-white font-semibold text-sm">Amount
                  <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: parseFloat(e.target.value).toFixed(2) }))} required placeholder="Enter amount (e.g., 1000.00)" className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Payment Date
                  <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                <label className="text-white font-semibold text-sm">Payment Method
                  <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </label>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors">Record Payment</button>
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="bg-white/20 hover:bg-white/30 text-white rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 