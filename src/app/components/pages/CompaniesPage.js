"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  Mono,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  Select,
  Stat,
  StatRow,
  Spinner,
  TableEmpty,
  TableLoading,
  TableWrap,
  Td,
  Th,
  Textarea,
  Tr,
} from "../ui";
import { api } from "@/lib/session";
import { INDUSTRIES, count, money, moneyShort } from "@/lib/format";

const EMPTY_FORM = {
  id: null,
  name: "",
  industry: "",
  address: "",
  tin: "",
  contact_person: "",
  phone: "",
  email: "",
};

const PER_PAGE = 12;

/**
 * Borrower directory. Admins and managers get the full editor; staff see the
 * same table read-only, which matches what the companies API will accept.
 */
export default function CompaniesPage({ canEdit }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/companies");
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const industriesInUse = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (industry !== "all" && c.industry !== industry) return false;
      if (!needle) return true;
      return [c.name, c.industry, c.contact_person, c.email, c.tin, c.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [companies, search, industry]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, industry]);

  const totals = useMemo(
    () => ({
      companies: companies.length,
      withLoans: companies.filter((c) => Number(c.loan_count) > 0).length,
      activeLoans: companies.reduce((sum, c) => sum + Number(c.active_loans || 0), 0),
      outstanding: companies.reduce((sum, c) => sum + Number(c.unpaid_amount || 0), 0),
      overdue: companies.reduce((sum, c) => sum + Number(c.overdue_count || 0), 0),
    }),
    [companies]
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(company) {
    setForm({
      id: company.id,
      name: company.name || "",
      industry: company.industry || "",
      address: company.address || "",
      tin: company.tin || "",
      contact_person: company.contact_person || "",
      phone: company.phone || "",
      email: company.email || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry,
        address: form.address,
        tin: form.tin,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
      };

      await api(form.id ? `/api/companies/${form.id}` : "/api/companies", {
        method: form.id ? "PUT" : "POST",
        body: payload,
      });

      setFormOpen(false);
      setNotice(form.id ? `Saved changes to ${payload.name}.` : `Added ${payload.name}.`);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(company) {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) return;

    setError("");
    try {
      await api(`/api/companies/${company.id}`, { method: "DELETE" });
      setNotice(`Deleted ${company.name}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Companies"
        description={
          canEdit
            ? "Borrowers on the books, with what each one still owes."
            : "Borrowers on the books. Contact an administrator to add or change a record."
        }
      >
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        {canEdit ? (
          <Button variant="primary" onClick={openCreate}>
            Add company
          </Button>
        ) : null}
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      <StatRow>
        <Stat label="Companies" value={count(totals.companies)} />
        <Stat
          label="With loans"
          value={count(totals.withLoans)}
          hint={`${count(totals.activeLoans)} still active`}
        />
        <Stat
          label="Unpaid instalments"
          value={moneyShort(totals.outstanding)}
          hint="Value of instalments not yet settled"
        />
        <Stat
          label="Overdue items"
          value={count(totals.overdue)}
          tone={totals.overdue > 0 ? "danger" : "default"}
          hint="Past due and unpaid"
        />
      </StatRow>

      <Card bodyClassName="">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 no-print">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, contact, TIN"
            className="w-full sm:w-72"
          />
          <Select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full sm:w-52"
          >
            <option value="all">All industries</option>
            {industriesInUse.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <span className="tnum ml-auto text-xs text-muted">
            {filtered.length} of {companies.length}
          </span>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>Contact</Th>
              <Th>TIN</Th>
              <Th align="right">Loans</Th>
              <Th align="right">Unpaid</Th>
              <Th align="right">Overdue</Th>
              {canEdit ? <Th align="right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={canEdit ? 8 : 7} label="Loading companies" />
            ) : visible.length === 0 ? (
              <TableEmpty colSpan={canEdit ? 8 : 7}>
                {companies.length === 0
                  ? "No companies yet."
                  : "No companies match this search."}
              </TableEmpty>
            ) : (
              visible.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="font-medium text-ink">{c.name}</div>
                    {c.email ? <div className="text-xs text-muted">{c.email}</div> : null}
                  </Td>
                  <Td className="text-ink-2">{c.industry || "–"}</Td>
                  <Td>
                    <div className="text-ink-2">{c.contact_person || "–"}</div>
                    {c.phone ? <div className="tnum text-xs text-muted">{c.phone}</div> : null}
                  </Td>
                  <Td>
                    <Mono>{c.tin || "–"}</Mono>
                  </Td>
                  <Td align="right" className="tnum text-ink-2">
                    {count(c.loan_count)}
                    {Number(c.active_loans) > 0 ? (
                      <span className="text-muted"> ({count(c.active_loans)} active)</span>
                    ) : null}
                  </Td>
                  <Td align="right" className="tnum font-medium text-ink">
                    {money(c.unpaid_amount)}
                  </Td>
                  <Td
                    align="right"
                    className={`tnum ${Number(c.overdue_count) > 0 ? "font-medium text-danger" : "text-muted"}`}
                  >
                    {count(c.overdue_count)}
                  </Td>
                  {canEdit ? (
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" onClick={() => openEdit(c)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
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

        {!loading && filtered.length > 0 ? (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={filtered.length}
            limit={PER_PAGE}
            onPage={setPage}
            unit="companies"
          />
        ) : null}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit company" : "Add company"}
        description={form.id ? form.name : "Register a new borrower."}
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {formError ? <Banner tone="danger">{formError}</Banner> : null}

            <Field label="Company name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Acme Manufacturing Inc."
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Industry">
                <Select
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                >
                  <option value="">Not specified</option>
                  {INDUSTRIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                  {form.industry && !INDUSTRIES.includes(form.industry) ? (
                    <option value={form.industry}>{form.industry}</option>
                  ) : null}
                </Select>
              </Field>

              <Field label="TIN">
                <Input
                  value={form.tin}
                  onChange={(e) => setForm((f) => ({ ...f, tin: e.target.value }))}
                  placeholder="000-000-000"
                />
              </Field>
            </div>

            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, city, province"
              />
            </Field>

            <Field label="Contact person">
              <Input
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="Full name"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Phone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+63 900 000 0000"
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="accounts@company.com"
                />
              </Field>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Add company"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
