"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-[6px] border border-line bg-canvas p-6">
        <h1 className="text-[15px] font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-[13px] text-muted">
          The page could not finish loading. Try again, and if it keeps happening check that the
          database connection is configured.
        </p>
        {error?.message ? (
          <p className="mt-3 rounded-[5px] border border-line bg-surface px-3 py-2 font-mono text-[11px] text-ink-2">
            {error.message}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-[34px] items-center rounded-[5px] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-hover"
          >
            Try again
          </button>
          <a
            href="/auth"
            className="inline-flex h-[34px] items-center rounded-[5px] border border-line-strong bg-canvas px-3.5 text-[13px] font-medium text-ink-2 hover:bg-surface"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
