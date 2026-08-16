"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  PageHeader,
  Pagination,
  RepaymentStatus,
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
import { count, date, isOverdue, money, moneyShort, today } from "@/lib/format";

const EMPTY_FORM = {
  id: null,
  company_id: "",
  loan_id: "",
  amount: "",
  due_date: today(),
  status: "unpaid",
};

const PER_PAGE = 15;

/**
 * The schedule across every loan. Filtering happens server-side so the counts
 * in the pager describe the whole filtered set rather than the current page.
 */
export default function RepaymentsPage({ basePath, canEdit }) {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loans, setLoans] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadReference = useCallback(async () => {
    try {
      const [companyRows, loanRows] = await Promise.all([
        api("/api/companies"),
        api("/api/loans"),
      ]);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
      setLoans(Array.isArray(loanRows) ? loanRows : []);
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
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await api(`/api/repayments?${params.toString()}`);
      setRows(res?.data || []);
      setPagination(res?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: PER_PAGE });
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, companyFilter, statusFilter]);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [companyFilter, statusFilter]);

  // Search narrows the page in hand; the filters above it query the server.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.loan_code, r.company_name, r.company_industry]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [rows, search]);

  const pageTotals = useMemo(
    () => ({
      amount: rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      paid: rows.filter((r) => r.status === "paid" || r.paid).length,
      overdue: rows.filter(isOverdue).length,
    }),
    [rows]
  );

  const loansForCompany = useMemo(() => {
    if (!form.company_id) return loans;
    return loans.filter((l) => l.company_id === form.company_id);
  }, [loans, form.company_id]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, company_id: companyFilter || "" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(row) {
    setForm({
      id: row.id,
      company_id: row.company_id || "",
      loan_id: row.loan_id || "",
      amount: String(row.amount ?? ""),
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : today(),
      status: row.status === "paid" || row.paid ? "paid" : "unpaid",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (form.id) {
        await api("/api/repayments", {
          method: "PUT",
          body: {
            id: form.id,
            amount: form.amount,
            due_date: form.due_date,
            status: form.status,
          },
        });
        setNotice("Repayment updated.");
      } else {
        await api("/api/repayments", {
          method: "POST",
          body: {
            loan_id: form.loan_id,
            amount: form.amount,
            due_date: form.due_date,
            status: form.status,
          },
        });
        setNotice("Repayment added to the schedule.");
      }

      setFormOpen(false);
      await Promise.all([loadRows(), loadReference()]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete the ${money(row.amount)} repayment due ${date(row.due_date)}?`)) {
      return;
    }
    setError("");
    try {
      await api("/api/repayments", { method: "DELETE", body: { id: row.id } });
      setNotice("Repayment deleted.");
      await Promise.all([loadRows(), loadReference()]);
    } catch (err) {
      setError(err.message);
    }
  }

  const columns = canEdit ? 8 : 7;

  return (
    <>
      <PageHeader
        title="Repayments"
        description="Scheduled instalments across every loan, earliest due date first."
      >
        <Button onClick={loadRows} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        {canEdit ? (
          <Button variant="primary" onClick={openCreate}>
            Add repayment
          </Button>
        ) : null}
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      <StatRow>
        <Stat label="Matching repayments" value={count(pagination.totalCount)} />
        <Stat label="Paid on this page" value={count(pageTotals.paid)} tone="ok" />
        <Stat
          label="Overdue on this page"
          value={count(pageTotals.overdue)}
          tone={pageTotals.overdue > 0 ? "danger" : "default"}
        />
        <Stat label="Page value" value={moneyShort(pageTotals.amount)} />
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
            className="w-full sm:w-60"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </Select>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Loan</Th>
              <Th>Due date</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Paid</Th>
              <Th>Status</Th>
              <Th>Loan status</Th>
              {canEdit ? <Th align="right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={columns} label="Loading repayments" />
            ) : visible.length === 0 ? (
              <TableEmpty colSpan={columns}>
                {pagination.totalCount === 0
                  ? "No repayments match these filters."
                  : "Nothing on this page matches your search."}
              </TableEmpty>
            ) : (
              visible.map((r) => (
                <Tr key={r.id} className={isOverdue(r) ? "bg-danger-soft/40" : ""}>
                  <Td>
                    <div className="text-ink">{r.company_name}</div>
                    {r.company_industry ? (
                      <div className="text-xs text-muted">{r.company_industry}</div>
                    ) : null}
                  </Td>
                  <Td>
                    <Link
                      href={`${basePath}/loans/${r.loan_id}`}
                      className="font-mono text-[12px] font-medium text-accent hover:underline"
                    >
                      {r.loan_code}
                    </Link>
                  </Td>
                  <Td className="tnum text-ink-2">{date(r.due_date)}</Td>
                  <Td align="right" className="tnum font-medium text-ink">{money(r.amount)}</Td>
                  <Td align="right" className="tnum text-ink-2">{money(r.amount_paid || 0)}</Td>
                  <Td>
                    <RepaymentStatus status={r.status} overdue={isOverdue(r)} />
                  </Td>
                  <Td>
                    <LoanStatus status={r.loan_status} />
                  </Td>
                  {canEdit ? (
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(r)}>
                          Delete
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
          unit="repayments"
        />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit repayment" : "Add repayment"}
        description={
          form.id
            ? "Adjust the amount, due date or status of this instalment."
            : "Add an extra instalment to an existing loan schedule."
        }
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {formError ? <Banner tone="danger">{formError}</Banner> : null}

            {!form.id ? (
              <>
                <Field label="Company">
                  <Select
                    value={form.company_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company_id: e.target.value, loan_id: "" }))
                    }
                  >
                    <option value="">All companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Loan" required>
                  <Select
                    value={form.loan_id}
                    onChange={(e) => setForm((f) => ({ ...f, loan_id: e.target.value }))}
                    required
                  >
                    <option value="">Select a loan</option>
                    {loansForCompany.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} · {l.company_name} · {money(l.principal)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Amount" required>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Due date" required>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field
              label="Status"
              hint={form.id ? "Reversing needs its payments removed first" : undefined}
            >
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </Select>
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Add repayment"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
