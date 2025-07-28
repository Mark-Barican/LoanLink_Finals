"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientNav() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem("user");
    window.location.href = "/auth";
  }

  // Hide navbar on authentication pages
  if (pathname === "/auth") {
    return null;
  }

  // Get role-based button styles
  const getButtonStyles = () => {
    if (!user) return "bg-green-400 text-slate-900 hover:bg-green-300";
    
    switch (user.role) {
      case 'admin':
        return "bg-green-400 text-slate-900 hover:bg-green-300";
      case 'manager':
        return "bg-blue-400 text-slate-900 hover:bg-blue-300";
      case 'staff':
        return "bg-orange-400 text-slate-900 hover:bg-orange-300";
      default:
        return "bg-green-400 text-slate-900 hover:bg-green-300";
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <>
      {/* Fixed Sign Out Button - Upper Right */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={handleSignOut} 
            className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors shadow-lg"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Navigation Buttons - Centered */}
      <div className="flex justify-center mt-8 mb-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Admin Dashboard Link - Only for Admin Users */}
          {user?.role === 'admin' && (
            <a href="/admin" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
              Admin Dashboard
            </a>
          )}
          
          {user?.role === 'admin' && (
            <a href="/admin/users" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
              User Management
            </a>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <a href="/admin/companies" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                Company Management
              </a>
              <a href="/admin/loans" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                Loan Management
              </a>
              <a href="/admin/repayments" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                Repayments
              </a>
              <a href="/admin/payments" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                Payments
              </a>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <a href="/admin/reports" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
              Reports
            </a>
          )}
          {user?.role === 'staff' && (
            <>
              <a href="/admin/companies" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                View Companies
              </a>
              <a href="/admin/loans" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                View Loans
              </a>
              <a href="/admin/repayments" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                View Repayments
              </a>
              <a href="/admin/payments" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                View Payments
              </a>
              <a href="/admin/reports" className={`${buttonStyles} rounded px-3 py-2 text-sm font-semibold transition-colors`}>
                View Reports
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
} 