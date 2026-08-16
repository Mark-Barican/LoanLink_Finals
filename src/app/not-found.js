import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-[6px] border border-line bg-canvas p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Error 404</p>
        <h1 className="mt-2 text-[15px] font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-[13px] text-muted">
          That address does not match anything in LoanLink. It may have been moved, or the record
          it pointed to was deleted.
        </p>
        <Link
          href="/auth"
          className="mt-5 inline-flex h-[34px] items-center rounded-[5px] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-hover"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
