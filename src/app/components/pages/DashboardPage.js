"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Banner,
  Button,
  Card,
  Meter,
  PageHeader,
  Spinner,
  Stat,
  StatRow,
  TableWrap,
  Td,
  Th,
  Tr,
} from "../ui";
import { api, getUser } from "@/lib/session";
import { count, dateTime, money, moneyShort, percent, titleCase } from "@/lib/format";

const REFRESH_MS = 60000;

/**
 * Landing screen for every role. The figures and the activity list both come
 * from /api/reports, so nothing on this page is placeholder content.
 */
export default function DashboardPage({ basePath, role }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/reports");
      setStats(data);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEmail(getUser()?.email || "");
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const collectionRate = stats?.paymentRate ?? 0;
  const overdueRatio =
    stats?.totalRepayments > 0
      ? Math.round((stats.overdueRepayments / stats.totalRepayments) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title={`${titleCase(role)} dashboard`}
        description={email ? `Signed in as ${email}` : undefined}
      >
        {updatedAt ? (
          <span className="tnum text-xs text-muted">
            Updated {updatedAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </span>
        ) : null}
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
      </PageHeader>

      {error ? (
        <Banner tone="danger" title="Could not load the figures" onDismiss={() => setError("")}>
          {error}
        </Banner>
      ) : null}

      {!stats && loading ? (
        <DashboardSkeleton />
      ) : stats ? (
        <>
          <StatRow>
            <Stat
              label="Portfolio lent"
              value={moneyShort(stats.totalLoanAmount)}
              hint={`${count(stats.activeLoans)} active of ${count(stats.totalLoans)} loans`}
            />
            <Stat
              label="Collected"
              value={moneyShort(stats.totalRepaid)}
              tone="ok"
              hint={`${count(stats.paidRepayments)} repayments settled`}
            />
            <Stat
              label={stats.isOverpaid ? "Overpaid by" : "Outstanding"}
              value={moneyShort(stats.outstandingBalance)}
              hint={stats.isOverpaid ? "Collections exceed the amount due" : "Principal plus interest still owed"}
            />
            <Stat
              label="Overdue"
              value={moneyShort(stats.overdueAmount)}
              tone={stats.overdueRepayments > 0 ? "danger" : "default"}
              hint={`${count(stats.overdueRepayments)} repayments past due`}
            />
          </StatRow>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card title="Recent activity" description="Loans booked, payments received and borrowers added">
                <ActivityList activity={stats.activity} />
              </Card>

              <Card title="This month" bodyClassName="">
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Measure</Th>
                      <Th align="right">This month</Th>
                      <Th align="right">Change on last month</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <MonthRow label="Loans booked" value={stats.recentLoans} change={stats.trends?.loans} />
                    <MonthRow label="Payments received" value={stats.recentPayments} change={stats.trends?.payments} />
                    <MonthRow label="Companies added" value={stats.recentCompanies} change={stats.trends?.companies} />
                  </tbody>
                </TableWrap>
              </Card>
            </div>

            <div className="space-y-5">
              <Card title="Portfolio health">
                <div className="space-y-4">
                  <RateRow
                    label="Collection rate"
                    value={percent(collectionRate)}
                    meter={collectionRate}
                    tone={collectionRate >= 80 ? "ok" : collectionRate >= 60 ? "warn" : "danger"}
                    note={`${count(stats.paidRepayments)} of ${count(stats.totalRepayments)} repayments paid`}
                  />
                  <RateRow
                    label="Overdue ratio"
                    value={percent(overdueRatio)}
                    meter={overdueRatio}
                    tone={overdueRatio === 0 ? "ok" : overdueRatio <= 10 ? "warn" : "danger"}
                    note={`${count(stats.overdueRepayments)} repayments past their due date`}
                  />
                  <div className="border-t border-line pt-4">
                    <dl className="space-y-2.5">
                      <SummaryRow label="Average loan size" value={money(stats.averageLoanAmount)} />
                      <SummaryRow label="Average instalment" value={money(stats.averageRepaymentAmount)} />
                      <SummaryRow label="Interest booked" value={money(stats.totalInterestAmount)} />
                      <SummaryRow label="Borrowers" value={count(stats.companies)} />
                    </dl>
                  </div>
                </div>
              </Card>

              <Card title="Go to">
                <div className="grid grid-cols-1 gap-1.5">
                  <QuickLink href={`${basePath}/loans`} label="Loan register" />
                  <QuickLink href={`${basePath}/repayments`} label="Repayment schedule" />
                  <QuickLink href={`${basePath}/payments`} label="Record a payment" />
                  <QuickLink href={`${basePath}/companies`} label="Borrower directory" />
                  <QuickLink
                    href={role === "manager" ? "/manager/reports" : `${basePath}/reports`}
                    label="Reports"
                  />
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function ActivityList({ activity }) {
  if (!activity || activity.length === 0) {
    return <p className="py-6 text-center text-[13px] text-muted">No activity recorded yet.</p>;
  }

  const labels = {
    loan: "Loan booked",
    payment: "Payment received",
    company: "Company added",
  };

  return (
    <ul className="divide-y divide-line">
      {activity.map((item, index) => (
        <li key={`${item.kind}-${index}`} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-[13px] text-ink">
              <span className="text-muted">{labels[item.kind] || "Activity"}</span>{" "}
              <span className="font-medium">{item.subject || "Unknown"}</span>
            </p>
            <p className="tnum mt-0.5 text-xs text-muted">
              {item.reference ? <span className="font-mono">{item.reference}</span> : null}
              {item.reference ? " · " : ""}
              {dateTime(item.at)}
            </p>
          </div>
          {item.amount !== null && item.amount !== undefined ? (
            <span className="tnum shrink-0 text-[13px] font-medium text-ink">
              {money(item.amount)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function MonthRow({ label, value, change }) {
  const delta = Number(change || 0);
  const text =
    delta === 0 ? "No change" : delta > 0 ? `+${count(delta)}` : `${count(delta)}`;
  const tone = delta === 0 ? "text-muted" : delta > 0 ? "text-ok" : "text-danger";

  return (
    <Tr>
      <Td className="text-ink-2">{label}</Td>
      <Td align="right" className="tnum font-medium text-ink">{count(value)}</Td>
      <Td align="right" className={`tnum ${tone}`}>{text}</Td>
    </Tr>
  );
}

function RateRow({ label, value, meter, tone, note }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] text-ink-2">{label}</span>
        <span className="tnum text-[13px] font-medium text-ink">{value}</span>
      </div>
      <Meter value={meter} tone={tone} />
      <p className="mt-1.5 text-xs text-muted">{note}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="tnum text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function QuickLink({ href, label }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[5px] px-2 py-2 text-[13px] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
    >
      {label}
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-faint" aria-hidden="true">
        <path
          d="M6 3.5 10.5 8 6 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[86px] rounded-[6px] border border-line bg-canvas" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-80 rounded-[6px] border border-line bg-canvas lg:col-span-2" />
        <div className="h-80 rounded-[6px] border border-line bg-canvas" />
      </div>
    </div>
  );
}
