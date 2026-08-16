"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  LoanStatus,
  Modal,
  ModalBody,
  ModalFooter,
  Mono,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  Select,
  Spinner,
  Stat,
  StatRow,
  TableEmpty,
  TableLoading,
  TableWrap,
  Td,
  Th,
  Tr,
} from "../ui";
import { api, getUser } from "@/lib/session";
import { addOnInterest, count, date, money, moneyShort, today } from "@/lib/format";

const EMPTY_FORM = {
  id: null,
  company_id: "",
  principal: "",
  interest_rate: "",
  term_months: "",
  start_date: today(),
  status: "active",
};

const PER_PAGE = 12;

/**
 * Loan register. Booking a loan writes its repayment schedule server-side using
 * the Philippine add-on method, so the form previews that arithmetic before the
 * user commits to it.
 */
export default function LoansPage({ basePath, canEdit }) {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loanRows, companyRows] = await Promise.all([
        api("/api/loans"),
        api("/api/companies"),
      ]);
      setLoans(Array.isArray(loanRows) ? loanRows : []);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return loans.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!needle) return true;
      return [l.code, l.company_name, l.company_industry, l.created_by_email]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [loans, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const totals = useMemo(() => {
    const principal = loans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
    const due = loans.reduce((sum, l) => sum + Number(l.total_amount || l.principal || 0), 0);
    const collected = loans.reduce((sum, l) => sum + Number(l.collected || 0), 0);
    return {
      active: loans.filter((l) => l.status === "active").length,
      principal,
      due,
      collected,
      outstanding: Math.max(0, due - collected),
    };
  }, [loans]);

  const preview = useMemo(
    () => addOnInterest(form.principal, form.interest_rate, form.term_months),
    [form.principal, form.interest_rate, form.term_months]
  );

  const editingHasPayments = useMemo(() => {
    if (!form.id) return false;
    const loan = loans.find((l) => l.id === form.id);
    return Number(loan?.collected || 0) > 0;
  }, [form.id, loans]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(loan) {
    setForm({
      id: loan.id,
      company_id: loan.company_id || "",
      principal: String(loan.principal ?? ""),
      interest_rate: String(loan.interest_rate ?? ""),
      term_months: String(loan.term_months ?? ""),
      start_date: loan.start_date ? String(loan.start_date).slice(0, 10) : today(),
      status: loan.status || "active",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const user = getUser();
    if (!user?.id) {
      setFormError("Your session is missing a user id. Sign out and sign in again.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: form.company_id,
        principal: form.principal,
        interest_rate: form.interest_rate,
        term_months: form.term_months,
        start_date: form.start_date,
        status: form.status,
        created_by: user.id,
      };

      const saved = await api(form.id ? `/api/loans/${form.id}` : "/api/loans", {
        method: form.id ? "PUT" : "POST",
        body: payload,
      });

      setFormOpen(false);
      if (!form.id) {
        setNotice(`Booked ${saved.code} with a ${payload.term_months}-month schedule.`);
      } else if (saved.scheduleRebuilt) {
        setNotice("Loan updated and its repayment schedule rebuilt.");
      } else {
        setNotice("Loan updated. The existing schedule was kept because payments are recorded against it.");
      }
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(loan) {
    const warning =
      Number(loan.collected || 0) > 0
        ? `${loan.code} has ${money(loan.collected)} collected against it. Deleting removes the loan, its schedule and those payments. Continue?`
        : `Delete ${loan.code} and its repayment schedule? This cannot be undone.`;

    if (!window.confirm(warning)) return;

    setError("");
    try {
      await api(`/api/loans/${loan.id}`, { method: "DELETE" });
      setNotice(`Deleted ${loan.code}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Loans"
        description={
          canEdit
            ? "Every loan on the register, with what has been collected so far."
            : "Every loan on the register. Open one to review its schedule and record payments."
        }
      >
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        {canEdit ? (
          <Button variant="primary" onClick={openCreate}>
            New loan
          </Button>
        ) : null}
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      <StatRow>
        <Stat label="Active loans" value={count(totals.active)} hint={`${count(loans.length)} in total`} />
        <Stat label="Principal lent" value={moneyShort(totals.principal)} />
        <Stat label="Collected" value={moneyShort(totals.collected)} tone="ok" />
        <Stat label="Outstanding" value={moneyShort(totals.outstanding)} hint="Principal plus interest, less collections" />
      </StatRow>

      <Card bodyClassName="">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 no-print">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or company"
            className="w-full sm:w-72"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="defaulted">Defaulted</option>
          </Select>
          <span className="tnum ml-auto text-xs text-muted">
            {filtered.length} of {loans.length}
          </span>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Company</Th>
              <Th align="right">Principal</Th>
              <Th align="right">Interest</Th>
              <Th align="right">Total due</Th>
              <Th align="right">Collected</Th>
              <Th align="right">Rate</Th>
              <Th align="right">Term</Th>
              <Th>Start</Th>
              <Th>Booked by</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={12} label="Loading loans" />
            ) : visible.length === 0 ? (
              <TableEmpty colSpan={12}>
                {loans.length === 0
                  ? canEdit
                    ? "No loans yet. Use New loan to book the first one."
                    : "No loans yet."
                  : "No loans match this search."}
              </TableEmpty>
            ) : (
              visible.map((l) => {
                const due = Number(l.total_amount || l.principal || 0);
                const collected = Number(l.collected || 0);
                return (
                  <Tr key={l.id}>
                    <Td>
                      <Link
                        href={`${basePath}/loans/${l.id}`}
                        className="font-mono text-[12px] font-medium text-accent hover:underline"
                      >
                        {l.code}
                      </Link>
                    </Td>
                    <Td>
                      <div className="text-ink">{l.company_name || "Unknown company"}</div>
                      {l.company_industry ? (
                        <div className="text-xs text-muted">{l.company_industry}</div>
                      ) : null}
                    </Td>
                    <Td align="right" className="tnum text-ink-2">{money(l.principal)}</Td>
                    <Td align="right" className="tnum text-ink-2">{money(l.total_interest || 0)}</Td>
                    <Td align="right" className="tnum font-medium text-ink">{money(due)}</Td>
                    <Td align="right" className="tnum text-ink-2">
                      {money(collected)}
                      <div className="text-xs text-muted">
                        {count(l.paid_count)}/{count(l.repayment_count)} paid
                      </div>
                    </Td>
                    <Td align="right" className="tnum text-ink-2">{Number(l.interest_rate)}%</Td>
                    <Td align="right" className="tnum text-ink-2">{count(l.term_months)} mo</Td>
                    <Td className="tnum text-ink-2">{date(l.start_date)}</Td>
                    <Td className="text-muted">{l.created_by_email || "–"}</Td>
                    <Td>
                      <LoanStatus status={l.status} />
                    </Td>
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" onClick={() => router.push(`${basePath}/loans/${l.id}`)}>
                          Open
                        </Button>
                        {canEdit ? (
                          <>
                            <Button size="sm" onClick={() => openEdit(l)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(l)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </RowActions>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </TableWrap>

        {!loading && filtered.length > 0 ? (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={filtered.length}
            limit={PER_PAGE}
            onPage={setPage}
            unit="loans"
          />
        ) : null}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit loan" : "New loan"}
        description={
          form.id
            ? "Changing the terms recalculates the interest and total."
            : "A monthly repayment schedule is generated when the loan is booked."
        }
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {formError ? <Banner tone="danger">{formError}</Banner> : null}

            {form.id && editingHasPayments ? (
              <Banner tone="warn" title="Payments already recorded">
                The schedule will be left as it is so existing payments stay attached. Only the
                headline figures update.
              </Banner>
            ) : null}

            <Field label="Company" required>
              <Select
                value={form.company_id}
                onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))}
                required
                disabled={Boolean(form.id)}
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Principal" required hint="Philippine peso">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={form.principal}
                onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
                placeholder="100000.00"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Annual interest rate" required hint="Percent">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.interest_rate}
                  onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))}
                  placeholder="12.00"
                  required
                />
              </Field>

              <Field label="Term" required hint="Months">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="360"
                  value={form.term_months}
                  onChange={(e) => setForm((f) => ({ ...f, term_months: e.target.value }))}
                  placeholder="12"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Start date" required>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  required
                />
              </Field>

              {form.id ? (
                <Field label="Status">
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </Select>
                </Field>
              ) : null}
            </div>

            {preview ? (
              <div className="rounded-[6px] border border-line bg-surface px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                  Add-on interest preview
                </p>
                <dl className="mt-2 grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-[11px] text-muted">Total interest</dt>
                    <dd className="tnum mt-0.5 text-[13px] font-medium text-ink">
                      {money(preview.totalInterest)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Total repayable</dt>
                    <dd className="tnum mt-0.5 text-[13px] font-medium text-ink">
                      {money(preview.totalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Monthly</dt>
                    <dd className="tnum mt-0.5 text-[13px] font-medium text-ink">
                      {money(preview.monthlyPayment)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
                  Principal <Mono>×</Mono> {Number(form.interest_rate) || 0}%{" "}
                  <Mono>×</Mono> {preview.years.toFixed(2)} years, spread evenly across{" "}
                  {form.term_months || 0} payments.
                </p>
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Book loan"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
