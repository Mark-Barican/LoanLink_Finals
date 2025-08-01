"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import components to avoid prerendering issues
const AdminNavbar = dynamic(() => import("../AdminNavbar"), { ssr: false });

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, email: "", password: "", role: "staff", department: "operations" });
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  function getRoleBadge(role) {
    const badges = {
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      staff: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };
    return badges[role] || badges.staff;
  }

  function getDepartmentColor(department) {
    const colors = {
      operations: "text-green-400",
      finance: "text-blue-400",
      risk_management: "text-purple-400",
      customer_service: "text-orange-400",
      sales: "text-pink-400",
      compliance: "text-red-400",
      it: "text-cyan-400",
      marketing: "text-yellow-400",
      legal: "text-indigo-400",
      collections: "text-rose-400",
      accounting: "text-emerald-400"
    };
    return colors[department] || "text-white/60";
  }

  function formatDepartment(department) {
    return department.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Calculate user statistics
  const userStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    staff: users.filter(u => u.role === 'staff').length
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <AdminNavbar currentPage="users" />
      
      {/* Background Pattern - Full Screen */}
      <div className="fixed inset-0 -z-10">
        <div className="h-full w-full bg-slate-950 [&>div]:absolute [&>div]:bottom-0 [&>div]:right-[-20%] [&>div]:top-[-10%] [&>div]:h-[500px] [&>div]:w-[500px] [&>div]:rounded-full [&>div]:bg-[radial-gradient(circle_farthest-side,rgba(34,197,94,.15),rgba(255,255,255,0))]">
          <div></div>
        </div>
      </div>
      
      {/* Content - Full width layout */}
      <div className="relative z-10 px-4 py-3 pt-24">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">User Management</h1>
          
          {error && <p className="text-red-300 text-sm text-center mb-4">{error}</p>}
          
          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Total Users</div>
              <div className="text-xl font-bold">{userStats.total}</div>
            </div>
            <div className="bg-red-400/20 text-red-400 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Admins</div>
              <div className="text-xl font-bold">{userStats.admin}</div>
            </div>
            <div className="bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Managers</div>
              <div className="text-xl font-bold">{userStats.manager}</div>
            </div>
            <div className="bg-orange-400/20 text-orange-400 border border-orange-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1">Staff</div>
              <div className="text-xl font-bold">{userStats.staff}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => openForm()} 
              className="bg-green-400 hover:bg-green-300 text-slate-900 rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-lg"
            >
              Add New User
            </button>
          </div>
          
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 backdrop-blur-md bg-white/10">
                <tr className="text-green-400 border-b border-white/20">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-white">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mr-3"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-white/60">
                      No users found. Add your first user to get started.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-white/10 text-white hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="font-medium">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(u.role)}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`${getDepartmentColor(u.department)} font-medium`}>
                          {formatDepartment(u.department || 'operations')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/60">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-PH') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openForm(u)} 
                            className="bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded px-3 py-1 text-xs font-semibold border border-green-400/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
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
                <h3 className="text-lg font-bold text-green-400 mb-2">{form.id ? 'Edit User' : 'Add New User'}</h3>
                
                <label className="text-white font-semibold text-sm">
                  Email Address
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                    required 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                    placeholder="user@example.com"
                  />
                </label>
                
                {!form.id && (
                  <label className="text-white font-semibold text-sm">
                    Password
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                      required 
                      className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-green-400/50" 
                      placeholder="Enter password"
                    />
                  </label>
                )}
                
                <label className="text-white font-semibold text-sm">
                  Role
                  <select 
                    value={form.role} 
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))} 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                
                <label className="text-white font-semibold text-sm">
                  Department
                  <select 
                    value={form.department} 
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))} 
                    className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-green-400/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="operations">Operations</option>
                    <option value="underwriting">Underwriting</option>
                    <option value="risk_management">Risk Management</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="sales">Sales</option>
                    <option value="compliance">Compliance</option>
                    <option value="finance">Finance</option>
                    <option value="it">IT & Technology</option>
                    <option value="marketing">Marketing</option>
                    <option value="legal">Legal</option>
                    <option value="collections">Collections</option>
                    <option value="accounting">Accounting</option>
                  </select>
                </label>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="submit" 
                    className="bg-green-400 hover:bg-green-300 text-slate-900 rounded px-4 py-2 text-sm font-semibold flex-1 transition-colors"
                  >
                    {form.id ? 'Update User' : 'Create User'}
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