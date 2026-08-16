"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
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
import { api } from "@/lib/session";
import { PAYMENT_METHODS, count, date, methodLabel, money, moneyShort, today } from "@/lib/format";

const PER_PAGE = 15;

const EMPTY_FORM = {
  id: null,
  mode: "single",
  company_id: "",
  repayment_id: "",
  amount: "",
  payment_date: today(),
  method: "cash",
};

/**
 * Collections. A payment can settle one instalment, or a lump sum can be spread
 * across a company's outstanding instalments oldest-first, which is how the
 * bulk mode works.
 */
export default function PaymentsPage({ basePath, canEdit }) {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [totals, setTotals] = useState({ totalAmount: 0, averageAmount: 0 });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: PER_PAGE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [openRepayments, setOpenRepayments] = useState([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCompanies = useCallback(async () => {
    try {
      const data = await api("/api/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (companyFilter) params.set("company_id", companyFilter);

      const res = await api(`/api/payments?${params.toString()}`);
      setRows(res?.data || []);
      setTotals(res?.totals || { totalAmount: 0, averageAmount: 0 });
      setPagination(res?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: PER_PAGE });
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, companyFilter]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [companyFilter]);

  // Outstanding instalments for whichever company the form has selected.
  useEffect(() => {
    if (!formOpen || !form.company_id) {
      setOpenRepayments([]);
      return;
    }

    let cancelled = false;
    setLoadingRepayments(true);

    api(`/api/repayments?company_id=${form.company_id}&status=unpaid&limit=200`)
      .then((res) => {
        if (!cancelled) setOpenRepayments(res?.data || []);
      })
      .catch((err) => {
        if (!cancelled) setFormError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingRepayments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formOpen, form.company_id]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((p) =>
      [p.loan_code, p.company_name, p.company_industry, p.method]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [rows, search]);

  const selectedCompany = companies.find((c) => c.id === companyFilter);

  const bulkPlan = useMemo(() => {
    if (form.mode !== "bulk") return null;
    let remaining = parseFloat(form.amount);
    if (!Number.isFinite(remaining) || remaining <= 0) return null;

    const ordered = [...openRepayments].sort(
      (a, b) => new Date(a.due_date) - new Date(b.due_date)
    );

    const allocations = [];
    for (const r of ordered) {
      if (remaining <= 0.005) break;
      const owed = Number(r.amount) - Number(r.amount_paid || 0);
      if (owed <= 0) continue;
      const applied = Math.min(remaining, owed);
      allocations.push({ repayment: r, applied });
      remaining -= applied;
    }

    return { allocations, leftover: Math.max(0, remaining) };
  }, [form.mode, form.amount, openRepayments]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, company_id: companyFilter || "" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(payment) {
    setForm({
      id: payment.id,
      mode: "single",
      company_id: payment.company_id || "",
      repayment_id: payment.repayment_id || "",
      amount: String(payment.amount ?? ""),
      payment_date: payment.payment_date ? String(payment.payment_date).slice(0, 10) : today(),
      method: payment.method || "cash",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (form.id) {
      setSaving(true);
      try {
        await api("/api/payments", {
          method: "PUT",
          body: {
            id: form.id,
            amount: form.amount,
            payment_date: form.payment_date,
            method: form.method,
          },
        });
        setFormOpen(false);
        setNotice("Payment updated.");
        await Promise.all([loadRows(), loadCompanies()]);
      } catch (err) {
        setFormError(err.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.company_id) {
      setFormError("Choose a company first.");
      return;
    }

    if (form.mode === "single" && !form.repayment_id) {
      setFormError("Choose which repayment this settles.");
      return;
    }

    if (form.mode === "bulk" && (!bulkPlan || bulkPlan.allocations.length === 0)) {
      setFormError("That amount does not cover any outstanding repayment.");
      return;
    }

    setSaving(true);
    try {
      if (form.mode === "bulk") {
        const payments = bulkPlan.allocations.map((a) => ({
          repayment_id: a.repayment.id,
          amount: a.applied.toFixed(2),
          payment_date: form.payment_date,
          method: form.method,
        }));

        const res = await api("/api/payments", { method: "POST", body: { payments } });
        setNotice(
          bulkPlan.leftover > 0
            ? `${res.message}. ${money(bulkPlan.leftover)} was left over and not applied.`
            : res.message
        );
      } else {
        await api("/api/payments", {
          method: "POST",
          body: {
            repayment_id: form.repayment_id,
            amount: form.amount,
            payment_date: form.payment_date,
            method: form.method,
          },
        });
        setNotice("Payment recorded.");
      }

      setFormOpen(false);
      await Promise.all([loadRows(), loadCompanies()]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(payment) {
    if (
      !window.confirm(
        `Reverse this ${money(payment.amount)} payment? The repayment it settled goes back to unpaid.`
      )
    ) {
      return;
    }

    setError("");
    try {
      await api("/api/payments", { method: "DELETE", body: { id: payment.id } });
      setNotice("Payment reversed.");
      await Promise.all([loadRows(), loadCompanies()]);
    } catch (err) {
      setError(err.message);
    }
  }

  const columns = canEdit ? 7 : 6;

  return (
    <>
      <PageHeader
        title="Payments"
        description="Money received against scheduled repayments."
      >
        <Button onClick={loadRows} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        {canEdit ? (
          <Button variant="primary" onClick={openCreate}>
            Record payment
          </Button>
        ) : null}
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      <StatRow>
        <Stat label="Payments" value={count(pagination.totalCount)} hint={companyFilter ? "For this company" : "All companies"} />
        <Stat label="Total collected" value={moneyShort(totals.totalAmount)} tone="ok" />
        <Stat label="Average payment" value={moneyShort(totals.averageAmount)} />
        <Stat
          label="Unpaid instalments"
          value={moneyShort(
            selectedCompany
              ? Number(selectedCompany.unpaid_amount || 0)
              : companies.reduce((sum, c) => sum + Number(c.unpaid_amount || 0), 0)
          )}
          hint={
            selectedCompany
              ? `${count(selectedCompany.payments_left)} instalments left`
              : "Across all borrowers"
          }
        />
      </StatRow>

      <Card bodyClassName="">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 no-print">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter this page"
            className="w-full sm:w-60"
          />
          <Select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-full sm:w-64"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {Number(c.payments_left) > 0 ? ` (${c.payments_left} left)` : ""}
              </option>
            ))}
          </Select>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Loan</Th>
              <Th>Settled instalment</Th>
              <Th align="right">Amount</Th>
              <Th>Payment date</Th>
              <Th>Method</Th>
              {canEdit ? <Th align="right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={columns} label="Loading payments" />
            ) : visible.length === 0 ? (
              <TableEmpty colSpan={columns}>
                {pagination.totalCount === 0
                  ? "No payments recorded yet."
                  : "Nothing on this page matches your search."}
              </TableEmpty>
            ) : (
              visible.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="text-ink">{p.company_name}</div>
                    {p.company_industry ? (
                      <div className="text-xs text-muted">{p.company_industry}</div>
                    ) : null}
                  </Td>
                  <Td>
                    <Link
                      href={`${basePath}/loans/${p.loan_id}`}
                      className="font-mono text-[12px] font-medium text-accent hover:underline"
                    >
                      {p.loan_code}
                    </Link>
                  </Td>
                  <Td>
                    <div className="tnum text-ink-2">Due {date(p.due_date)}</div>
                    <div className="tnum text-xs text-muted">{money(p.repayment_amount)}</div>
                  </Td>
                  <Td align="right" className="tnum font-medium text-ink">{money(p.amount)}</Td>
                  <Td className="tnum text-ink-2">{date(p.payment_date)}</Td>
                  <Td className="text-ink-2">{methodLabel(p.method)}</Td>
                  {canEdit ? (
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
                          Reverse
                        </Button>
                      </RowActions>
                    </Td>
                  ) : null}
                </Tr>
              ))
            )}
          </tbody>
        </TableWrap>

        <Pagination
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPage={setPage}
          unit="payments"
        />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit payment" : "Record payment"}
        description={
          form.id
            ? "Adjust the amount, date or method of a recorded payment."
            : "Settle one instalment, or spread a lump sum across the oldest outstanding ones."
        }
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {formError ? <Banner tone="danger">{formError}</Banner> : null}

            {!form.id ? (
              <>
                <div className="flex gap-2 rounded-[5px] border border-line bg-surface p-1">
                  <ModeButton
                    active={form.mode === "single"}
                    onClick={() => setForm((f) => ({ ...f, mode: "single" }))}
                    label="One instalment"
                  />
                  <ModeButton
                    active={form.mode === "bulk"}
                    onClick={() => setForm((f) => ({ ...f, mode: "bulk", repayment_id: "" }))}
                    label="Lump sum"
                  />
                </div>

                <Field label="Company" required>
                  <Select
                    value={form.company_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company_id: e.target.value, repayment_id: "", amount: "" }))
                    }
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {Number(c.payments_left) > 0 ? ` (${c.payments_left} left)` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>

                {form.company_id && loadingRepayments ? (
                  <p className="flex items-center gap-2 text-[13px] text-muted">
                    <Spinner /> Loading outstanding repayments
                  </p>
                ) : null}

                {form.company_id && !loadingRepayments && openRepayments.length === 0 ? (
                  <Banner tone="info">This company has no outstanding repayments.</Banner>
                ) : null}

                {form.mode === "single" && openRepayments.length > 0 ? (
                  <Field label="Repayment" required>
                    <Select
                      value={form.repayment_id}
                      onChange={(e) => {
                        const chosen = openRepayments.find((r) => r.id === e.target.value);
                        setForm((f) => ({
                          ...f,
                          repayment_id: e.target.value,
                          amount: chosen ? String(chosen.amount) : f.amount,
                        }));
                      }}
                      required
                    >
                      <option value="">Select a repayment</option>
                      {openRepayments.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.loan_code} · {money(r.amount)} · due {date(r.due_date)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Amount" required hint="Philippine peso">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={form.mode === "bulk" ? "Total received" : "0.00"}
                  required
                />
              </Field>

              <Field label="Payment date" required>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field label="Method">
              <Select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>

            {form.mode === "bulk" && bulkPlan ? (
              <div className="rounded-[6px] border border-line bg-surface px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                  This will settle {bulkPlan.allocations.length} repayment
                  {bulkPlan.allocations.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {bulkPlan.allocations.map((a) => (
                    <li key={a.repayment.id} className="flex justify-between text-[12px]">
                      <span className="text-ink-2">
                        <span className="font-mono">{a.repayment.loan_code}</span> due{" "}
                        {date(a.repayment.due_date)}
                      </span>
                      <span className="tnum font-medium text-ink">{money(a.applied)}</span>
                    </li>
                  ))}
                </ul>
                {bulkPlan.leftover > 0 ? (
                  <p className="mt-2 border-t border-line pt-2 text-[12px] text-warn">
                    {money(bulkPlan.leftover)} exceeds what is outstanding and will not be applied.
                  </p>
                ) : null}
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Record payment"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}

function ModeButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active ? "bg-canvas text-ink shadow-[0_1px_2px_rgba(28,25,23,0.08)]" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
