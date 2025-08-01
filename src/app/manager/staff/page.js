"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ManagerNavbar from "../ManagerNavbar";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    email: "", 
    name: "", 
    role: "staff",
    status: "active"
  });
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
    if (!user || user.role !== "manager") {
      router.replace("/auth");
      return;
    }
    fetchStaff();
  }, [router]);

  async function fetchStaff() {
    try {
      setError("");
      const res = await fetch("/api/staff", {
        headers: {
          "x-user-role": "manager"
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch staff');
      }
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError("Failed to load staff members");
    }
  }

  function openForm(staffMember = null) {
    if (staffMember) {
      setForm({
        id: staffMember.id,
        email: staffMember.email || "",
        name: staffMember.name || "",
        role: staffMember.role || "staff",
        status: staffMember.status || "active"
      });
    } else {
      setForm({
        id: null,
        email: "",
        name: "",
        role: "staff",
        status: "active"
      });
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({
      id: null,
      email: "",
      name: "",
      role: "staff",
      status: "active"
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = form.id ? `/api/staff` : "/api/staff";
      const method = form.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "manager"
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save staff member');
      }

      await fetchStaff();
      closeForm();
    } catch (err) {
      console.error('Save staff error:', err);
      setError(err.message || "Failed to save staff member");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      setError("");
      const res = await fetch(`/api/staff`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "manager"
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete staff member');
      }

      await fetchStaff();
    } catch (err) {
      console.error('Delete staff error:', err);
      setError("Failed to delete staff member");
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <ManagerNavbar currentPage="staff" />
        <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-800/50 rounded-lg w-1/4 mb-3"></div>
            <div className="h-6 bg-slate-800/50 rounded w-1/3 mb-8"></div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/30">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-slate-700 rounded mb-1"></div>
                      <div className="w-24 h-3 bg-slate-700 rounded"></div>
                    </div>
                    <div className="w-20 h-4 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ManagerNavbar currentPage="staff" />
      <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">Staff Management</h1>
            <p className="text-slate-400 text-lg">Manage your team members</p>
          </div>
          <button
            onClick={() => openForm()}
            className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Staff Member
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Staff Members
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-white/60 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">{member.name || "N/A"}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          member.status === "active" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(member.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openForm(member)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {staff.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/60">No staff members found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                {form.id ? "Edit Staff Member" : "Add Staff Member"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-500/50 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? "Saving..." : (form.id ? "Update" : "Create")}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border border-slate-600/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 