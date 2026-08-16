"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { Wordmark } from "./Sidebar";
import { getUser, homeFor } from "@/lib/session";

/**
 * Wraps every signed-in page: guards the route against the wrong role,
 * renders the sidebar, and gives the page a consistent content column.
 *
 * `allow` lists the roles permitted here. A signed-in user with the wrong role
 * is sent to their own dashboard rather than back to sign-in, which is what the
 * old per-page checks did and it made role switching feel like a logout.
 */
export default function AppShell({ allow, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Depend on the contents rather than the array identity, so callers can pass
  // an inline list without the effect re-running on every render.
  const allowKey = allow ? allow.join(",") : "";

  useEffect(() => {
    const current = getUser();

    if (!current) {
      router.replace("/auth");
      return;
    }

    if (allowKey && !allowKey.split(",").includes(current.role)) {
      router.replace(homeFor(current.role));
      return;
    }

    setUser(current);
    setChecked(true);
  }, [router, allowKey]);

  if (!checked || !user) {
    return <BootScreen />;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Persistent sidebar from the large breakpoint up. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line lg:block no-print">
        <Sidebar user={user} />
      </aside>

      {/* Compact header with a slide-over below that breakpoint. */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-canvas px-4 lg:hidden no-print">
        <Wordmark />
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          className="rounded-[5px] border border-line-strong p-1.5 text-ink-2 hover:bg-surface"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden no-print">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/25"
          />
          <div className="absolute inset-y-0 left-0 w-60 border-r border-line">
            <Sidebar user={user} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/** Shown for the instant it takes to read the session out of localStorage. */
function BootScreen() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-canvas lg:block">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Wordmark />
        </div>
        <div className="space-y-2 p-4">
          {[64, 48, 56, 52, 44, 60].map((width, i) => (
            <div key={i} className="h-4 rounded bg-surface-2" style={{ width: `${width}%` }} />
          ))}
        </div>
      </div>
      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-7 w-56 rounded bg-surface-2" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[86px] rounded-[6px] border border-line bg-canvas" />
            ))}
          </div>
          <div className="h-72 rounded-[6px] border border-line bg-canvas" />
        </div>
      </main>
    </div>
  );
}
