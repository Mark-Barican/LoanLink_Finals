"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [user, setUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/auth");
  }

  const handleAuth = (userData) => {
    setUser(userData);
    setShowNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
    
    // Redirect to role-specific dashboard
    setTimeout(() => {
      switch (userData.role) {
        case 'admin':
          router.push("/admin");
          break;
        case 'manager':
          router.push("/manager");
          break;
        case 'staff':
          router.push("/staff");
          break;
        default:
          router.push("/admin");
      }
    }, 1000);
  };

  if (user) {
    return (
      <div className="relative h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#22c55e_100%)]"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome, {user.email}</h2>
            <p className="text-green-200 mb-4">Role: {user.role}</p>
            <button onClick={handleSignOut} className="rounded-lg px-6 py-3 font-medium bg-green-400 text-slate-900 hover:bg-green-300 transition-colors">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#22c55e_100%)]"></div>
      </div>
      
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm border border-green-400/30 animate-notification">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Successfully logged in!</p>
                <p className="text-sm opacity-90">Welcome to LoanLink</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 w-full max-w-md h-[400px] flex flex-col">
          <div className="flex justify-center mb-4 gap-4">
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${mode === "signin" ? "bg-green-400 text-slate-900" : "bg-white/20 text-white border border-white/30"}`}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${mode === "signup" ? "bg-green-400 text-slate-900" : "bg-white/20 text-white border border-white/30"}`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {mode === "signin" ? <SigninForm onAuth={handleAuth} /> : <SignupForm onAuth={handleAuth} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SigninForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Sign in failed");
      return;
    }
    localStorage.setItem("user", JSON.stringify(data));
    onAuth(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
      <label className="text-white font-semibold">Email
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-white/50"
        />
      </label>
      <label className="text-white font-semibold">Password
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-white/50"
        />
      </label>
      <button type="submit" className="rounded-lg px-6 py-2 font-medium bg-green-400 text-slate-900 hover:bg-green-300 transition-colors mt-2">Sign In</button>
      {error && <p className="text-red-300 text-center mt-1 text-sm">{error}</p>}
    </form>
  );
}

function SignupForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("operations");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "staff", department }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    localStorage.setItem("user", JSON.stringify(data));
    onAuth(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
      <label className="text-white font-semibold">Email
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-white/50"
        />
      </label>
      <label className="text-white font-semibold">Password
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-white/50"
        />
      </label>
      <label className="text-white font-semibold">Department
        <select
          value={department}
          onChange={e => setDepartment(e.target.value)}
          className="border border-white/30 bg-white/10 rounded px-3 py-2 w-full mt-1 text-white backdrop-blur-sm focus:outline-none focus:border-white/50 [&>option]:bg-slate-800 [&>option]:text-white"
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
      <button type="submit" className="rounded-lg px-6 py-2 font-medium bg-green-400 text-slate-900 hover:bg-green-300 transition-colors mt-2">Sign Up</button>
      {error && <p className="text-red-300 text-center mt-1 text-sm">{error}</p>}
    </form>
  );
} 