const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pesoWhole = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-PH");

/** Full peso amount with centavos, for tables and totals. */
export function money(value) {
  const n = Number(value);
  return peso.format(Number.isFinite(n) ? n : 0);
}

/** Rounded peso amount, for headline figures where centavos are noise. */
export function moneyShort(value) {
  const n = Number(value);
  return pesoWhole.format(Number.isFinite(n) ? n : 0);
}

export function count(value) {
  const n = Number(value);
  return plain.format(Number.isFinite(n) ? n : 0);
}

export function percent(value, digits = 0) {
  const n = Number(value);
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}

/** 12 Aug 2025 */
export function date(value) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** 12 Aug 2025, 3:04 PM */
export function dateTime(value) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Date in the yyyy-mm-dd shape an <input type="date"> needs.
 * Reads the local calendar date so a timestamp near midnight does not slip a day.
 */
export function dateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today() {
  return dateInput(new Date());
}

/** Words that should not be sentence-cased when a label is built. */
const ACRONYMS = { it: "IT", tin: "TIN", hr: "HR" };

/** operations -> Operations, risk_management -> Risk Management, it -> IT */
export function titleCase(value) {
  if (!value) return "–";
  return String(value)
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => ACRONYMS[word.toLowerCase()] || word.replace(/^\w/, (c) => c.toUpperCase()))
    .join(" ");
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "check", label: "Check" },
  { value: "online", label: "Online" },
];

export function methodLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || titleCase(value || "cash");
}

export const DEPARTMENTS = [
  "operations",
  "underwriting",
  "risk_management",
  "customer_service",
  "sales",
  "compliance",
  "finance",
  "it",
  "marketing",
  "legal",
  "collections",
  "accounting",
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Education",
  "Transportation",
  "Logistics",
  "Construction",
  "Energy",
  "Renewable Energy",
  "Food & Beverage",
  "Consulting",
  "Creative Services",
  "Entertainment",
  "Other",
];

/** A repayment is overdue when it is still unpaid and its due date has passed. */
export function isOverdue(repayment) {
  if (!repayment || repayment.status === "paid" || repayment.paid) return false;
  const due = new Date(repayment.due_date);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due < startOfToday;
}

/**
 * Philippine add-on interest, the same arithmetic the loans API uses when it
 * writes a schedule. Kept here so the loan form can preview a loan before saving.
 */
export function addOnInterest(principal, ratePercent, termMonths) {
  const p = Number(principal);
  const r = Number(ratePercent);
  const t = Number(termMonths);
  if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(t) || t <= 0) {
    return null;
  }
  const totalInterest = Number((p * (r / 100) * (t / 12)).toFixed(2));
  const totalAmount = Number((p + totalInterest).toFixed(2));
  const monthlyPayment = Number((totalAmount / t).toFixed(2));
  return { totalInterest, totalAmount, monthlyPayment, years: t / 12 };
}
