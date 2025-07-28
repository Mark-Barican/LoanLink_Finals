"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, email: "", password: "", role: "staff", department: "operations" });
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "admin") {
      router.replace("/auth");
      return;
    }
    fetchUsers();
  }, [router]);

  async function fetchUsers() {
    try {
      setError("");
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/api/users", { 
        headers: { "x-user-role": user.role } 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load users');
      }
      
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || "Failed to load users");
      setUsers([]);
    }
  }

  function openForm(user = { id: null, email: "", password: "", role: "staff", department: "operations" }) {
    setForm(user);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const method = form.id ? "PUT" : "POST";
      const body = { 
        email: form.email, 
        role: form.role, 
        department: form.department 
      };
      
      if (!form.id) body.password = form.password;
      if (form.id) body.id = form.id;
      
      const res = await fetch("/api/users", {
        method,
        headers: { 
          "Content-Type": "application/json", 
          "x-user-role": user.role 
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save user');
      }
      
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || "Failed to save user");
    }
  }

  async function handleDelete(id) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!window.confirm("Delete this user?")) return;
      
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json", 
          "x-user-role": user.role 
        },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      fetchUsers();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || "Failed to delete user");
    }
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
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-4 w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
          <h1 className="text-lg font-bold text-green-400 mb-4 text-center">User Management</h1>
          
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => openForm()} className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-3 py-1.5 text-sm font-semibold transition-colors">Add User</button>
            {error && <p className="text-red-300 text-sm">{error}</p>}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Department</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-2 text-center text-white/60">No users found</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-white/10 text-white">
                      <td className="py-1.5 px-2">{u.email}</td>
                      <td className="py-1.5 px-2">{u.role}</td>
                      <td className="py-1.5 px-2">{u.department || 'operations'}</td>
                      <td className="py-1.5 px-2 flex gap-1">
                        <button onClick={() => openForm(u)} className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-2 py-1 text-xs font-semibold border border-green-400/30">Edit</button>
                        <button onClick={() => handleDelete(u.id)} className="bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded px-2 py-1 text-xs font-semibold border border-red-400/30">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-900/90 rounded-xl p-6 flex flex-col gap-3 border border-white/20 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit User' : 'Add User'}</h3>
                <label className="text-white font-semibold text-sm">Email
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                </label>
                {!form.id && (
                  <label className="text-white font-semibold text-sm">Password
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" />
                  </label>
                )}
                <label className="text-white font-semibold text-sm">Role
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="text-white font-semibold text-sm">Department
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="operations">Operations</option>
                    <option value="finance">Finance</option>
                    <option value="risk">Risk Management</option>
                    <option value="compliance">Compliance</option>
                    <option value="customer_service">Customer Service</option>
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