"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import Link to avoid prerendering issues
const DynamicLink = dynamic(() => import("next/link"), { ssr: false });

export default function AdminNavbar({ currentPage = "dashboard" }) {
  const router = useRouter();

  const getButtonClass = (page) => {
    return page === currentPage
      ? "bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      : "bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <DynamicLink
            href="/admin"
            className={getButtonClass("dashboard")}
          >
            Admin Dashboard
          </DynamicLink>
          
          <DynamicLink
            href="/admin/companies"
            className={getButtonClass("companies")}
          >
            Companies
          </DynamicLink>
          
          <DynamicLink
            href="/admin/loans"
            className={getButtonClass("loans")}
          >
            Loans
          </DynamicLink>
          
          <DynamicLink
            href="/admin/users"
            className={getButtonClass("users")}
          >
            Users
          </DynamicLink>
          
          <DynamicLink
            href="/admin/payments"
            className={getButtonClass("payments")}
          >
            Payments
          </DynamicLink>
          
          <DynamicLink
            href="/admin/repayments"
            className={getButtonClass("repayments")}
          >
            Repayments
          </DynamicLink>
          
          <DynamicLink
            href="/admin/reports"
            className={getButtonClass("reports")}
          >
            Reports
          </DynamicLink>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-slate-300 text-sm font-medium">Admin</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/auth");
            }}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 