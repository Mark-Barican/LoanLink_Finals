"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearUser } from "@/lib/session";
import { titleCase } from "@/lib/format";

/* 16px line icons, one weight, no fills. */
const icons = {
  dashboard: "M3 3h5.5v5.5H3V3Zm7.5 0H16v5.5h-5.5V3ZM3 10.5h5.5V16H3v-5.5Zm7.5 0H16V16h-5.5v-5.5Z",
  companies: "M3 16V4.5A1.5 1.5 0 0 1 4.5 3h6A1.5 1.5 0 0 1 12 4.5V16M12 8h2.5A1.5 1.5 0 0 1 16 9.5V16M2 16h15M5.5 6h3M5.5 9h3M5.5 12h3",
  loans: "M4 2.5h6.5L15 7v10.5H4V2.5Zm6.5 0V7H15M6.5 10.5h6M6.5 13h4",
  repayments: "M2.5 5.5h15v9h-15v-9Zm0 3h15M5.5 12h3",
  payments: "M10 3v14M13 5.5H8.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H6.5",
  users: "M13 16v-1.5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3V16M7.5 8.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM18 16v-1.5a3 3 0 0 0-2.25-2.9M12.75 3.1a3 3 0 0 1 0 5.8",
  reports: "M3 16.5V8m4.667 8.5V3.5M12.333 16.5v-6M17 16.5v-10",
  staff: "M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4 17v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1",
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d={icons[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Navigation per role. Each role gets the sections it can actually act on,
 * so a staff member never sees a link that will bounce them to sign-in.
 */
export const NAV = {
  admin: [
    { section: null, items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }] },
    {
      section: "Portfolio",
      items: [
        { href: "/admin/companies", label: "Companies", icon: "companies" },
        { href: "/admin/loans", label: "Loans", icon: "loans" },
        { href: "/admin/repayments", label: "Repayments", icon: "repayments" },
        { href: "/admin/payments", label: "Payments", icon: "payments" },
      ],
    },
    {
      section: "Administration",
      items: [
        { href: "/admin/users", label: "Users", icon: "users" },
        { href: "/admin/reports", label: "Reports", icon: "reports" },
      ],
    },
  ],
  manager: [
    { section: null, items: [{ href: "/manager/dashboard", label: "Dashboard", icon: "dashboard" }] },
    {
      section: "Portfolio",
      items: [
        { href: "/manager/companies", label: "Companies", icon: "companies" },
        { href: "/manager/loans", label: "Loans", icon: "loans" },
        { href: "/manager/repayments", label: "Repayments", icon: "repayments" },
        { href: "/manager/payments", label: "Payments", icon: "payments" },
      ],
    },
    {
      section: "Team",
      items: [
        { href: "/manager/staff", label: "Staff", icon: "staff" },
        { href: "/manager/reports", label: "Reports", icon: "reports" },
      ],
    },
  ],
  staff: [
    { section: null, items: [{ href: "/staff", label: "Dashboard", icon: "dashboard" }] },
    {
      section: "Portfolio",
      items: [
        { href: "/staff/companies", label: "Companies", icon: "companies" },
        { href: "/staff/loans", label: "Loans", icon: "loans" },
        { href: "/staff/repayments", label: "Repayments", icon: "repayments" },
        { href: "/staff/payments", label: "Payments", icon: "payments" },
      ],
    },
    { section: null, items: [{ href: "/staff/reports", label: "Reports", icon: "reports" }] },
  ],
};

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-[22px] w-[22px]" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#1b6b45" />
        <rect x="8" y="8" width="16" height="2.5" rx="1.25" fill="#fff" />
        <rect x="8" y="14.75" width="16" height="2.5" rx="1.25" fill="#fff" opacity="0.72" />
        <rect x="8" y="21.5" width="9" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">LoanLink</span>
    </span>
  );
}

export default function Sidebar({ user, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = NAV[user.role] || [];

  function isActive(href) {
    if (pathname === href) return true;
    // Nested routes such as /admin/loans/<id> keep the parent item marked.
    return pathname.startsWith(`${href}/`);
  }

  function signOut() {
    clearUser();
    router.replace("/auth");
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <Wordmark />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group, index) => (
          <div key={group.section || `group-${index}`} className={index > 0 ? "mt-5" : ""}>
            {group.section ? (
              <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                {group.section}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-[13px] transition-colors ${
                        active
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-ink-2 hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent"
                        />
                      ) : null}
                      <Icon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line px-3 py-3">
        <div className="mb-2 min-w-0">
          <p className="truncate text-[13px] font-medium text-ink" title={user.email}>
            {user.email}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {titleCase(user.role)}
            {user.department ? ` · ${titleCase(user.department)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path
              d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3h-5A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17h5a1.5 1.5 0 0 0 1.5-1.5V14M8.5 10H17m0 0-2.5-2.5M17 10l-2.5 2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}
