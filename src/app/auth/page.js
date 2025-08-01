"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Skeleton Loading Component
function SkeletonLoader() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Skeleton Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Skeleton */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse mr-3"></div>
              <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse"></div>
            </div>
            <div className="w-48 h-6 bg-white/10 rounded-lg animate-pulse mx-auto"></div>
          </div>

          {/* Auth Container Skeleton */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            {/* Tab Navigation Skeleton */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
              <div className="flex-1 px-4 py-3 rounded-xl bg-white/10 animate-pulse"></div>
              <div className="flex-1 px-4 py-3 rounded-xl bg-white/10 animate-pulse ml-1"></div>
            </div>

            {/* Form Skeleton */}
            <div className="space-y-4">
              <div>
                <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
              </div>
              <div>
                <div className="w-20 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
              </div>
              <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse mt-6"></div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="text-center mt-6">
            <div className="w-48 h-4 bg-white/10 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [user, setUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("user");
      if (u) {
        const userData = JSON.parse(u);
        setUser(userData);
        // Automatically redirect logged-in users to their dashboard
        setIsRedirecting(true);
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
        }, 100);
      }
    }
  }, [router]);

  const handleAuth = (userData) => {
    setUser(userData);
    setShowNotification(true);
    
    // Dispatch custom event for navbar update
    window.dispatchEvent(new Event("userLogin"));
    
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

  // Show skeleton while redirecting
  if (isRedirecting) {
    return <SkeletonLoader />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-green-400/30 animate-notification">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg">Successfully logged in!</p>
                <p className="text-sm opacity-90">Welcome to LoanLink Financial</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white">LoanLink</h1>
            </div>
            <p className="text-green-300 text-lg font-medium">Financial Management System</p>
          </div>

          {/* Auth Container */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            {/* Tab Navigation */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
              <button
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                  mode === "signin" 
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setMode("signin")}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </div>
              </button>
              <button
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${
                  mode === "signup" 
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setMode("signup")}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </div>
              </button>
            </div>

            {/* Form Content */}
            <div className="transition-all duration-300">
              {mode === "signin" ? <SigninForm onAuth={handleAuth} /> : <SignupForm onAuth={handleAuth} />}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-white/50 text-sm">Secure • Reliable • Professional</p>
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
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
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-white font-semibold text-sm mb-2 block">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
          />
        </div>
      </div>
      
      <div>
        <label className="text-white font-semibold text-sm mb-2 block">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Signing In...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </div>
        )}
      </button>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-300 text-sm text-center">{error}</p>
        </div>
      )}
    </form>
  );
}

function SignupForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("operations");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
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
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-white font-semibold text-sm mb-2 block">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
          />
        </div>
      </div>
      
      <div>
        <label className="text-white font-semibold text-sm mb-2 block">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
          />
        </div>
      </div>
      
      <div>
        <label className="text-white font-semibold text-sm mb-2 block">Department</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="operations" className="bg-slate-800 text-white">Operations</option>
            <option value="underwriting" className="bg-slate-800 text-white">Underwriting</option>
            <option value="risk_management" className="bg-slate-800 text-white">Risk Management</option>
            <option value="customer_service" className="bg-slate-800 text-white">Customer Service</option>
            <option value="sales" className="bg-slate-800 text-white">Sales</option>
            <option value="compliance" className="bg-slate-800 text-white">Compliance</option>
            <option value="finance" className="bg-slate-800 text-white">Finance</option>
            <option value="it" className="bg-slate-800 text-white">IT & Technology</option>
            <option value="marketing" className="bg-slate-800 text-white">Marketing</option>
            <option value="legal" className="bg-slate-800 text-white">Legal</option>
            <option value="collections" className="bg-slate-800 text-white">Collections</option>
            <option value="accounting" className="bg-slate-800 text-white">Accounting</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creating Account...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create Account
          </div>
        )}
      </button>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-300 text-sm text-center">{error}</p>
        </div>
      )}
    </form>
  );
} 