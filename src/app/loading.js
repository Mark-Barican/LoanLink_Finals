export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <svg viewBox="0 0 16 16" className="h-4 w-4 animate-spin" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <path
            d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Loading
      </div>
    </div>
  );
}
