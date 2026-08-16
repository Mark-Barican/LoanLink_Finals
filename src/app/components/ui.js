"use client";

import { useEffect, useId, useRef } from "react";

/* ------------------------------------------------------------------ layout */

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13px] text-muted">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 no-print">{children}</div>
      ) : null}
    </div>
  );
}

export function Card({ title, description, actions, children, className = "", bodyClassName = "p-4" }) {
  return (
    <section className={`rounded-[6px] border border-line bg-canvas ${className}`}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A labelled figure. Used for the metric strips at the top of each page. */
export function Stat({ label, value, hint, tone = "default" }) {
  const valueTone =
    tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : "text-ink";
  return (
    <div className="rounded-[6px] border border-line bg-canvas px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
      <div className={`tnum mt-1.5 text-[22px] font-semibold leading-none ${valueTone}`}>
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function StatRow({ children, cols = 4 }) {
  const grid =
    cols === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : cols === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={`grid grid-cols-1 gap-3 ${grid}`}>{children}</div>;
}

/* ----------------------------------------------------------------- buttons */

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-[5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizes = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-[34px] px-3.5 text-[13px]",
};

const buttonVariants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-line-strong bg-canvas text-ink-2 hover:bg-surface hover:text-ink",
  ghost: "text-muted hover:bg-surface hover:text-ink",
  danger: "border border-danger-line bg-canvas text-danger hover:bg-danger-soft",
};

export function Button({
  variant = "secondary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- forms */

const controlClass =
  "w-full rounded-[5px] border border-line-strong bg-canvas px-2.5 text-[13px] text-ink placeholder:text-faint " +
  "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 disabled:bg-surface disabled:text-muted";

export function Field({ label, hint, error, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-ink-2">
          {label}
          {required ? <span className="ml-0.5 text-muted">*</span> : null}
        </span>
        {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-danger">{error}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`${controlClass} h-[34px] ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return (
    <textarea rows={rows} className={`${controlClass} resize-y py-2 ${className}`} {...props} />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`${controlClass} h-[34px] cursor-pointer appearance-none pr-8 ${className}`}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
      >
        <path
          d="M2.5 4.5 6 8l3.5-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Search box with a magnifier and a clear affordance. */
export function SearchInput({ value, onChange, placeholder = "Search", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
      >
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${controlClass} h-[34px] pl-8`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ status */

const statusTones = {
  ok: "border-ok-line bg-ok-soft text-ok",
  warn: "border-warn-line bg-warn-soft text-warn",
  danger: "border-danger-line bg-danger-soft text-danger",
  quiet: "border-quiet-line bg-quiet-soft text-quiet",
};

export function StatusPill({ tone = "quiet", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${statusTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LoanStatus({ status }) {
  const map = {
    active: { tone: "ok", label: "Active" },
    completed: { tone: "quiet", label: "Completed" },
    defaulted: { tone: "danger", label: "Defaulted" },
  };
  const s = map[status] || { tone: "quiet", label: status || "Unknown" };
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
}

export function RepaymentStatus({ status, overdue }) {
  if (status === "paid") return <StatusPill tone="ok">Paid</StatusPill>;
  if (overdue) return <StatusPill tone="danger">Overdue</StatusPill>;
  return <StatusPill tone="warn">Unpaid</StatusPill>;
}

/* ---------------------------------------------------------------- messages */

export function Banner({ tone = "danger", title, children, onDismiss }) {
  const tones = {
    danger: "border-danger-line bg-danger-soft text-danger",
    warn: "border-warn-line bg-warn-soft text-warn",
    ok: "border-ok-line bg-ok-soft text-ok",
    info: "border-line bg-surface text-ink-2",
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-[6px] border px-3 py-2.5 ${tones[tone]}`}>
      <div className="min-w-0 flex-1 text-[13px]">
        {title ? <div className="font-medium">{title}</div> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 16 16" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ tables */

export function TableWrap({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, align = "left", className = "" }) {
  const alignment = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-line bg-surface px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted ${alignment} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "", ...props }) {
  const alignment = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <td className={`border-b border-line px-3 py-2.5 align-middle ${alignment} ${className}`} {...props}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr className={`hover:bg-surface ${className}`} {...props}>
      {children}
    </tr>
  );
}

/** Row-level action cluster. Kept as text buttons so rows stay scannable. */
export function RowActions({ children }) {
  return <div className="flex items-center justify-end gap-1.5 no-print">{children}</div>;
}

export function TableLoading({ colSpan, label = "Loading" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-b border-line px-3 py-10 text-center">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          <Spinner />
          {label}
        </span>
      </td>
    </tr>
  );
}

export function TableEmpty({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-b border-line px-3 py-10 text-center text-[13px] text-muted">
        {children}
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------- pagination */

export function Pagination({ page, totalPages, totalCount, limit, onPage, unit = "records" }) {
  if (!totalCount) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalCount);

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 no-print">
      <p className="tnum text-xs text-muted">
        {first}&ndash;{last} of {totalCount} {unit}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
            Previous
          </Button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`tnum h-7 min-w-7 rounded-[5px] px-2 text-xs font-medium transition-colors ${
                p === page
                  ? "bg-accent text-white"
                  : "border border-line-strong bg-canvas text-ink-2 hover:bg-surface"
              }`}
            >
              {p}
            </button>
          ))}
          <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ modals */

export function Modal({ open, onClose, title, description, children, width = "max-w-lg" }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog so keyboard users are not left behind it.
    panelRef.current?.querySelector("input, select, textarea, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/25 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative my-auto w-full ${width} rounded-[6px] border border-line bg-canvas shadow-[0_12px_32px_rgba(28,25,23,0.12)]`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[13px] font-semibold text-ink">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-0.5 rounded p-1 text-muted hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5">
              <path
                d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ModalBody({ children, className = "" }) {
  return <div className={`space-y-3.5 px-4 py-4 ${className}`}>{children}</div>;
}

export function ModalFooter({ children }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3">
      {children}
    </div>
  );
}

/* ----------------------------------------------------------- misc display */

/** Loan codes, TINs and other identifiers. */
export function Mono({ children, className = "" }) {
  return <span className={`font-mono text-[12px] text-ink-2 ${className}`}>{children}</span>;
}

/** Two-column key/value list used on detail screens. */
export function DetailList({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            {item.label}
          </dt>
          <dd className={`mt-1 text-[13px] text-ink ${item.mono ? "font-mono" : "tnum"}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Thin horizontal meter for rates and ratios. */
export function Meter({ value, tone }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const bar =
    tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warn" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
