"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function ClientNav() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check for user on mount and set up listener for storage changes
    const checkUser = () => {
      const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
      setUser(userData);
      setIsLoading(false);
    };

    checkUser();

    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        checkUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom events
    window.addEventListener("userLogin", checkUser);
    window.addEventListener("userLogout", checkUser);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogin", checkUser);
      window.removeEventListener("userLogout", checkUser);
    };
  }, []);

  function handleSignOut() {
    localStorage.removeItem("user");
    // Dispatch custom event
    window.dispatchEvent(new Event("userLogout"));
    window.location.href = "/auth";
  }

  // Show loading state briefly
  if (isLoading) {
    return null;
  }

  // Hide navbar on authentication pages
  if (pathname === "/auth") {
    return null;
  }

  // Don't show navbar if no user is logged in
  if (!user) {
    return null;
  }

  // Get role-based button styles
  const getButtonStyles = (isActive = false) => {
    const baseStyles = "rounded px-3 py-2 text-sm font-semibold transition-colors";
    
    if (isActive) {
      switch (user.role) {
        case 'admin':
          return `${baseStyles} bg-green-500 text-slate-900 shadow-lg ring-2 ring-green-300`;
        case 'manager':
          return `${baseStyles} bg-blue-500 text-slate-900 shadow-lg ring-2 ring-blue-300`;
        case 'staff':
          return `${baseStyles} bg-orange-500 text-slate-900 shadow-lg ring-2 ring-orange-300`;
        default:
          return `${baseStyles} bg-green-500 text-slate-900 shadow-lg ring-2 ring-green-300`;
      }
    } else {
      switch (user.role) {
        case 'admin':
          return `${baseStyles} bg-green-400 text-slate-900 hover:bg-green-300`;
        case 'manager':
          return `${baseStyles} bg-blue-400 text-slate-900 hover:bg-blue-300`;
        case 'staff':
          return `${baseStyles} bg-orange-400 text-slate-900 hover:bg-orange-300`;
        default:
          return `${baseStyles} bg-green-400 text-slate-900 hover:bg-green-300`;
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
      {/* Fixed Sign Out Button - Upper Right */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={handleSignOut} 
          className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors shadow-lg"
        >
          Sign Out
        </button>
      </div>

      {/* Navigation Buttons - Centered */}
      <div className="flex justify-center py-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Admin Dashboard Link - Only for Admin Users */}
          {user?.role === 'admin' && (
            <Link href="/admin" className={getButtonStyles(pathname === "/admin")}>
              Admin Dashboard
            </Link>
          )}
          
          {user?.role === 'admin' && (
            <Link href="/admin/users" className={getButtonStyles(pathname === "/admin/users")}>
              User Management
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <Link href="/admin/companies" className={getButtonStyles(pathname === "/admin/companies")}>
                Company Management
              </Link>
              <Link href="/admin/loans" className={getButtonStyles(pathname === "/admin/loans")}>
                Loan Management
              </Link>
              <Link href="/admin/repayments" className={getButtonStyles(pathname === "/admin/repayments")}>
                Repayments
              </Link>
              <Link href="/admin/payments" className={getButtonStyles(pathname === "/admin/payments")}>
                Payments
              </Link>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link href="/admin/reports" className={getButtonStyles(pathname === "/admin/reports")}>
              Reports
            </Link>
          )}
          {user?.role === 'staff' && (
            <>
              <Link href="/admin/companies" className={getButtonStyles(pathname === "/admin/companies")}>
                View Companies
              </Link>
              <Link href="/admin/loans" className={getButtonStyles(pathname === "/admin/loans")}>
                View Loans
              </Link>
              <Link href="/admin/repayments" className={getButtonStyles(pathname === "/admin/repayments")}>
                View Repayments
              </Link>
              <Link href="/admin/payments" className={getButtonStyles(pathname === "/admin/payments")}>
                View Payments
              </Link>
              <Link href="/admin/reports" className={getButtonStyles(pathname === "/admin/reports")}>
                View Reports
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 