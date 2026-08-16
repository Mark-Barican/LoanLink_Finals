"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banner,
  Button,
  Card,
  DetailList,
  Field,
  Input,
  LoanStatus,
  Meter,
  Modal,
  ModalBody,
  ModalFooter,
  Mono,
  PageHeader,
  RepaymentStatus,
  RowActions,
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
import {
  PAYMENT_METHODS,
  count,
  date,
  dateTime,
  isOverdue,
  methodLabel,
  money,
  moneyShort,
  percent,
  today,
} from "@/lib/format";

/**
 * One loan: its terms, the generated schedule, and the payments recorded
 * against it. Recording a payment is the only route that settles a repayment,
 * which keeps the collected figure and the repayment status in step.
 */
export default function LoanDetailPage({ loanId, basePath, canEdit }) {
  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    repayment_id: "",
    amount: "",
    payment_date: today(),
    method: "cash",
  });
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loanRow, repaymentRes, paymentRes] = await Promise.all([
        api(`/api/loans/${loanId}`),
        api(`/api/repayments?loan_id=${loanId}&limit=200`),
        api(`/api/payments?loan_id=${loanId}&limit=200`),
      ]);
      setLoan(loanRow);
      setRepayments(repaymentRes?.data || []);
      setPayments(paymentRes?.data || []);
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const due = Number(loan?.total_amount || loan?.principal || 0);
    const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const paidCount = repayments.filter((r) => r.status === "paid" || r.paid).length;
    const overdueCount = repayments.filter(isOverdue).length;
    return {
      due,
      collected,
      outstanding: Math.max(0, due - collected),
      paidCount,
      overdueCount,
      progress: due > 0 ? Math.min(100, (collected / due) * 100) : 0,
    };
  }, [loan, repayments, payments]);

  const nextDue = useMemo(
    () => repayments.find((r) => r.status !== "paid" && !r.paid) || null,
    [repayments]
  );

  function openPayment(repayment) {
    setPayForm({
      repayment_id: repayment.id,
      amount: String(repayment.amount ?? ""),
      payment_date: today(),
      method: "cash",
    });
    setPayError("");
    setPayOpen(true);
  }

  async function submitPayment(event) {
    event.preventDefault();
    setPayError("");
    setSaving(true);

    try {
      await api("/api/payments", { method: "POST", body: payForm });
      setPayOpen(false);
      setNotice("Payment recorded.");
      await load();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(payment) {
    if (!window.confirm(`Reverse this ${money(payment.amount)} payment? The repayment goes back to unpaid.`)) {
      return;
    }
    setError("");
    try {
      await api("/api/payments", { method: "DELETE", body: { id: payment.id } });
      setNotice("Payment reversed.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Loan not found" description="This loan may have been deleted." />
        <Card>
          <Link href={`${basePath}/loans`} className="text-[13px] text-accent hover:underline">
            Back to loans
          </Link>
        </Card>
      </>
    );
  }

  if (loading && !loan) {
    return (
      <>
        <PageHeader title="Loan" description="Loading" />
        <div className="h-40 rounded-[6px] border border-line bg-canvas" />
      </>
    );
  }

  return (
    <>
      <div className="no-print">
        <Link href={`${basePath}/loans`} className="text-[13px] text-muted hover:text-ink">
          &larr; Loans
        </Link>
      </div>

      <PageHeader
        title={loan?.code || "Loan"}
        description={
          loan?.company_name
            ? `${loan.company_name}${loan.company_industry ? ` · ${loan.company_industry}` : ""}`
            : undefined
        }
      >
        <LoanStatus status={loan?.status} />
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      <StatRow>
        <Stat label="Total repayable" value={moneyShort(summary.due)} hint={`${money(loan?.principal)} principal`} />
        <Stat label="Collected" value={moneyShort(summary.collected)} tone="ok" hint={`${count(summary.paidCount)} of ${count(repayments.length)} repayments`} />
        <Stat
          label="Outstanding"
          value={moneyShort(summary.outstanding)}
          tone={summary.outstanding > 0 ? "default" : "ok"}
        />
        <Stat
          label="Overdue"
          value={count(summary.overdueCount)}
          tone={summary.overdueCount > 0 ? "danger" : "default"}
          hint={nextDue ? `Next due ${date(nextDue.due_date)}` : "Nothing outstanding"}
        />
      </StatRow>

      <Card title="Loan terms">
        <DetailList
          items={[
            { label: "Code", value: loan?.code || "–", mono: true },
            { label: "Principal", value: money(loan?.principal) },
            { label: "Interest rate", value: `${Number(loan?.interest_rate || 0)}% per year` },
            { label: "Term", value: `${count(loan?.term_months)} months` },
            { label: "Total interest", value: money(loan?.total_interest || 0) },
            { label: "Total repayable", value: money(summary.due) },
            { label: "Start date", value: date(loan?.start_date) },
            { label: "Booked by", value: loan?.created_by_email || "–" },
          ]}
        />

        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Collection progress
            </span>
            <span className="tnum text-[13px] font-medium text-ink">
              {percent(summary.progress)}
            </span>
          </div>
          <Meter value={summary.progress} />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Interest uses the Philippine add-on method: principal{" "}
            <Mono>×</Mono> {Number(loan?.interest_rate || 0)}% <Mono>×</Mono>{" "}
            {((loan?.term_months || 0) / 12).toFixed(2)} years ={" "}
            {money(loan?.total_interest || 0)}, divided evenly across{" "}
            {count(loan?.term_months)} monthly payments.
          </p>
        </div>
      </Card>

      <Card
        title="Repayment schedule"
        description={`${count(repayments.length)} scheduled payments`}
        bodyClassName=""
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Due date</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Paid</Th>
              <Th>Status</Th>
              <Th>Settled on</Th>
              {canEdit ? <Th align="right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={canEdit ? 7 : 6} label="Loading schedule" />
            ) : repayments.length === 0 ? (
              <TableEmpty colSpan={canEdit ? 7 : 6}>
                This loan has no repayment schedule.
              </TableEmpty>
            ) : (
              repayments.map((r, index) => {
                const settled = r.status === "paid" || r.paid;
                return (
                  <Tr key={r.id} className={isOverdue(r) ? "bg-danger-soft/40" : ""}>
                    <Td className="tnum text-muted">{index + 1}</Td>
                    <Td className="tnum text-ink-2">{date(r.due_date)}</Td>
                    <Td align="right" className="tnum font-medium text-ink">{money(r.amount)}</Td>
                    <Td align="right" className="tnum text-ink-2">{money(r.amount_paid || 0)}</Td>
                    <Td>
                      <RepaymentStatus status={r.status} overdue={isOverdue(r)} />
                    </Td>
                    <Td className="tnum text-muted">
                      {!settled ? "–" : r.paid_at ? dateTime(r.paid_at) : "Not recorded"}
                    </Td>
                    {canEdit ? (
                      <Td align="right">
                        <RowActions>
                          {settled ? (
                            <span className="text-xs text-muted">Settled</span>
                          ) : (
                            <Button size="sm" variant="primary" onClick={() => openPayment(r)}>
                              Record payment
                            </Button>
                          )}
                        </RowActions>
                      </Td>
                    ) : null}
                  </Tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      </Card>

      <Card
        title="Payments received"
        description={`${count(payments.length)} recorded, ${money(summary.collected)} total`}
        bodyClassName=""
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Payment date</Th>
              <Th>Applied to</Th>
              <Th align="right">Amount</Th>
              <Th>Method</Th>
              <Th>Recorded</Th>
              {canEdit ? <Th align="right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={canEdit ? 6 : 5} label="Loading payments" />
            ) : payments.length === 0 ? (
              <TableEmpty colSpan={canEdit ? 6 : 5}>
                Nothing collected on this loan yet.
              </TableEmpty>
            ) : (
              payments.map((p) => (
                <Tr key={p.id}>
                  <Td className="tnum text-ink-2">{date(p.payment_date)}</Td>
                  <Td className="tnum text-ink-2">Due {date(p.due_date)}</Td>
                  <Td align="right" className="tnum font-medium text-ink">{money(p.amount)}</Td>
                  <Td className="text-ink-2">{methodLabel(p.method)}</Td>
                  <Td className="tnum text-muted">{dateTime(p.paid_at || p.created_at)}</Td>
                  {canEdit ? (
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" variant="danger" onClick={() => deletePayment(p)}>
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
      </Card>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        description="Settles the selected repayment and updates the loan status."
      >
        <form onSubmit={submitPayment}>
          <ModalBody>
            {payError ? <Banner tone="danger">{payError}</Banner> : null}

            <Field label="Amount" required hint="Philippine peso">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Payment date" required>
                <Input
                  type="date"
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Method">
                <Select
                  value={payForm.method}
                  onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setPayOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              Record payment
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
