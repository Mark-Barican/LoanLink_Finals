"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Banner,
  Button,
  Card,
  Meter,
  PageHeader,
  Select,
  Spinner,
  Stat,
  StatRow,
  StatusPill,
  TableEmpty,
  TableWrap,
  Td,
  Th,
  Tr,
} from "../ui";
import { api } from "@/lib/session";
import { count, methodLabel, money, moneyShort, percent, titleCase } from "@/lib/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/*
  Chart palette. Categorical series use a sequential green ramp so no colour
  reads as a judgement; amber and red stay reserved for overdue and shortfall,
  where the colour is the message.
*/
const INK = "#1c1917";
const MUTED = "#78716c";
const LINE = "#e7e5e4";
const RAMP = ["#1b6b45", "#3f8a63", "#6ba888", "#9cc6b0", "#c3ded0"];
const AMBER = "#a16207";
const RED = "#b42318";

const RANGES = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
];

const baseFont = { family: "var(--font-plex-sans), sans-serif", size: 11 };

const axisOptions = (currency = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: MUTED, font: baseFont, usePointStyle: true, boxWidth: 6, padding: 16 },
    },
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: INK,
      bodyColor: INK,
      borderColor: LINE,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 5,
      titleFont: { ...baseFont, size: 12, weight: "600" },
      bodyFont: baseFont,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      callbacks: currency
        ? {
            label: (ctx) => ` ${ctx.dataset.label}: ${money(ctx.parsed.y)}`,
          }
        : undefined,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      ticks: {
        color: MUTED,
        font: baseFont,
        padding: 8,
        callback: currency ? (value) => moneyShort(value) : undefined,
      },
      grid: { color: LINE, drawTicks: false },
    },
    x: {
      border: { color: LINE },
      ticks: { color: MUTED, font: baseFont, padding: 6 },
      grid: { display: false },
    },
  },
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "right",
      labels: { color: MUTED, font: baseFont, usePointStyle: true, boxWidth: 6, padding: 12 },
    },
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: INK,
      bodyColor: INK,
      borderColor: LINE,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 5,
      titleFont: { ...baseFont, size: 12, weight: "600" },
      bodyFont: baseFont,
      callbacks: { label: (ctx) => ` ${ctx.label}: ${money(ctx.parsed)}` },
    },
  },
};

/**
 * Analytics. `variant` trims the view for staff, who need the operational
 * numbers but not the borrower-by-borrower financial breakdown.
 */
export default function ReportsPage({ variant = "full" }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("6");
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/reports?months=${range}`);
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const cashFlow = useMemo(() => {
    if (!stats) return null;
    const months = Array.from(
      new Set([
        ...(stats.charts?.monthlyLoans || []).map((r) => r.month),
        ...(stats.charts?.monthlyPayments || []).map((r) => r.month),
      ])
    );
    if (months.length === 0) return null;

    const lend = months.map(
      (m) => stats.charts.monthlyLoans.find((r) => r.month === m)?.amount || 0
    );
    const collect = months.map(
      (m) => stats.charts.monthlyPayments.find((r) => r.month === m)?.amount || 0
    );

    return {
      labels: months,
      datasets: [
        {
          label: "Lent out",
          data: lend,
          borderColor: RAMP[0],
          backgroundColor: "rgba(27, 107, 69, 0.08)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: RAMP[0],
        },
        {
          label: "Collected",
          data: collect,
          borderColor: AMBER,
          backgroundColor: "rgba(161, 98, 7, 0.06)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: AMBER,
        },
      ],
    };
  }, [stats]);

  const methodMix = useMemo(() => {
    const rows = stats?.charts?.paymentMethodsDistribution || [];
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r) => methodLabel(r.method)),
      datasets: [
        {
          data: rows.map((r) => r.amount),
          backgroundColor: rows.map((_, i) => RAMP[i % RAMP.length]),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const repaymentTrend = useMemo(() => {
    const rows = stats?.charts?.repaymentStatusByMonth || [];
    if (rows.length === 0) return null;
    const months = Array.from(new Set(rows.map((r) => r.month)));
    return {
      labels: months,
      datasets: [
        {
          label: "Paid",
          data: months.map(
            (m) => rows.find((r) => r.month === m && r.status === "paid")?.count || 0
          ),
          backgroundColor: RAMP[0],
          borderRadius: 2,
        },
        {
          label: "Unpaid",
          data: months.map(
            (m) => rows.find((r) => r.month === m && r.status !== "paid")?.count || 0
          ),
          backgroundColor: AMBER,
          borderRadius: 2,
        },
      ],
    };
  }, [stats]);

  const topBorrowers = useMemo(() => {
    const rows = stats?.charts?.companyLoanDistribution || [];
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r) => r.company),
      datasets: [
        {
          label: "Total lent",
          data: rows.map((r) => r.totalAmount),
          backgroundColor: RAMP[0],
          borderRadius: 2,
        },
        {
          label: "Still active",
          data: rows.map((r) => r.activeAmount),
          backgroundColor: RAMP[2],
          borderRadius: 2,
        },
      ],
    };
  }, [stats]);

  const tabs =
    variant === "basic"
      ? [{ id: "overview", label: "Overview" }, { id: "collections", label: "Collections" }]
      : [
          { id: "overview", label: "Overview" },
          { id: "collections", label: "Collections" },
          { id: "borrowers", label: "Borrowers" },
        ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Portfolio performance and collection activity."
      >
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-44">
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        <Button onClick={() => window.print()}>Print</Button>
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}

      {!stats && loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[86px] rounded-[6px] border border-line bg-canvas" />
            ))}
          </div>
          <div className="h-80 rounded-[6px] border border-line bg-canvas" />
        </div>
      ) : stats ? (
        <>
          <div className="flex gap-1 border-b border-line no-print" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                  tab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <>
              <StatRow>
                <Stat
                  label="Portfolio lent"
                  value={moneyShort(stats.totalLoanAmount)}
                  hint={`${count(stats.totalLoans)} loans booked`}
                />
                <Stat
                  label="Collected"
                  value={moneyShort(stats.totalRepaid)}
                  tone="ok"
                  hint={`${percent(stats.paymentRate)} of instalments settled`}
                />
                <Stat
                  label={stats.isOverpaid ? "Overpaid by" : "Outstanding"}
                  value={moneyShort(stats.outstandingBalance)}
                  hint="Principal plus add-on interest"
                />
                <Stat
                  label="Overdue"
                  value={moneyShort(stats.overdueAmount)}
                  tone={stats.overdueRepayments > 0 ? "danger" : "default"}
                  hint={`${count(stats.overdueRepayments)} instalments past due`}
                />
              </StatRow>

              <Card
                title="Lending against collections"
                description={`Monthly totals over the last ${stats.windowMonths} months`}
              >
                {cashFlow ? (
                  <div className="h-72">
                    <Line data={cashFlow} options={axisOptions(true)} />
                  </div>
                ) : (
                  <ChartEmpty>No loans or payments fall inside this window.</ChartEmpty>
                )}
              </Card>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card title="Instalments by month" description="Settled against still open">
                  {repaymentTrend ? (
                    <div className="h-64">
                      <Bar data={repaymentTrend} options={axisOptions(false)} />
                    </div>
                  ) : (
                    <ChartEmpty>No instalments fall inside this window.</ChartEmpty>
                  )}
                </Card>

                <Card title="How borrowers pay" description="Share of collections by method">
                  {methodMix ? (
                    <div className="h-64">
                      <Doughnut data={methodMix} options={doughnutOptions} />
                    </div>
                  ) : (
                    <ChartEmpty>No payments recorded yet.</ChartEmpty>
                  )}
                </Card>
              </div>
            </>
          ) : null}

          {tab === "collections" ? (
            <>
              <StatRow>
                <Stat label="Instalments settled" value={count(stats.paidRepayments)} tone="ok" />
                <Stat label="Still open" value={count(stats.unpaidRepayments)} />
                <Stat
                  label="Past due"
                  value={count(stats.overdueRepayments)}
                  tone={stats.overdueRepayments > 0 ? "danger" : "default"}
                />
                <Stat label="Average instalment" value={money(stats.averageRepaymentAmount)} />
              </StatRow>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Card title="Collection health" className="lg:col-span-1">
                  <div className="space-y-4">
                    <RateBlock
                      label="Collection rate"
                      value={stats.paymentRate}
                      note={`${count(stats.paidRepayments)} of ${count(stats.totalRepayments)} instalments`}
                      good={stats.paymentRate >= 80}
                      fair={stats.paymentRate >= 60}
                    />
                    <RateBlock
                      label="Overdue ratio"
                      value={
                        stats.totalRepayments > 0
                          ? Math.round((stats.overdueRepayments / stats.totalRepayments) * 100)
                          : 0
                      }
                      note={`${money(stats.overdueAmount)} past its due date`}
                      invert
                    />
                    <div className="space-y-2.5 border-t border-line pt-4">
                      <KeyValue label="Amount due in total" value={money(stats.totalAmountToRepay)} />
                      <KeyValue label="Interest booked" value={money(stats.totalInterestAmount)} />
                      <KeyValue label="Payments recorded" value={count(stats.totalPayments)} />
                    </div>
                  </div>
                </Card>

                <Card
                  title="Collections over time"
                  description={`Last ${stats.windowMonths} months`}
                  className="lg:col-span-2"
                >
                  {cashFlow ? (
                    <div className="h-64">
                      <Line data={cashFlow} options={axisOptions(true)} />
                    </div>
                  ) : (
                    <ChartEmpty>Nothing collected inside this window.</ChartEmpty>
                  )}
                </Card>
              </div>

              <Card title="Payment methods" description="Count and value by method" bodyClassName="">
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Method</Th>
                      <Th align="right">Payments</Th>
                      <Th align="right">Value</Th>
                      <Th align="right">Share of collections</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.charts?.paymentMethodsDistribution || []).length === 0 ? (
                      <TableEmpty colSpan={4}>No payments recorded yet.</TableEmpty>
                    ) : (
                      stats.charts.paymentMethodsDistribution.map((row) => {
                        const share =
                          stats.totalRepaid > 0 ? (row.amount / stats.totalRepaid) * 100 : 0;
                        return (
                          <Tr key={row.method}>
                            <Td className="text-ink">{methodLabel(row.method)}</Td>
                            <Td align="right" className="tnum text-ink-2">{count(row.count)}</Td>
                            <Td align="right" className="tnum font-medium text-ink">{money(row.amount)}</Td>
                            <Td align="right" className="tnum text-ink-2">{percent(share, 1)}</Td>
                          </Tr>
                        );
                      })
                    )}
                  </tbody>
                </TableWrap>
              </Card>
            </>
          ) : null}

          {tab === "borrowers" ? (
            <>
              <StatRow cols={3}>
                <Stat label="Borrowers" value={count(stats.companies)} />
                <Stat label="Average loan size" value={money(stats.averageLoanAmount)} />
                <Stat label="Active loans" value={count(stats.activeLoans)} />
              </StatRow>

              <Card title="Largest borrowers" description="By total principal lent">
                {topBorrowers ? (
                  <div className="h-72">
                    <Bar data={topBorrowers} options={axisOptions(true)} />
                  </div>
                ) : (
                  <ChartEmpty>No company has a loan yet.</ChartEmpty>
                )}
              </Card>

              <Card
                title="Repayment performance"
                description="Ranked by how much of the total due has been collected"
                bodyClassName=""
              >
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Company</Th>
                      <Th align="right">Loans</Th>
                      <Th align="right">Principal</Th>
                      <Th align="right">Interest</Th>
                      <Th align="right">Total due</Th>
                      <Th align="right">Paid</Th>
                      <Th align="right">Outstanding</Th>
                      <Th align="right">Rate</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.topPerformingCompanies || []).length === 0 ? (
                      <TableEmpty colSpan={8}>No borrower has a loan yet.</TableEmpty>
                    ) : (
                      stats.topPerformingCompanies.map((c) => {
                        const due = c.totalPrincipal + c.totalInterest;
                        const outstanding = Math.max(0, due - c.totalPaid);
                        const tone =
                          c.repaymentRate >= 80 ? "ok" : c.repaymentRate >= 50 ? "warn" : "danger";
                        return (
                          <Tr key={c.company}>
                            <Td className="text-ink">{c.company}</Td>
                            <Td align="right" className="tnum text-ink-2">{count(c.loanCount)}</Td>
                            <Td align="right" className="tnum text-ink-2">{money(c.totalPrincipal)}</Td>
                            <Td align="right" className="tnum text-ink-2">{money(c.totalInterest)}</Td>
                            <Td align="right" className="tnum font-medium text-ink">{money(due)}</Td>
                            <Td align="right" className="tnum text-ink-2">{money(c.totalPaid)}</Td>
                            <Td
                              align="right"
                              className={`tnum ${outstanding > 0 ? "text-ink-2" : "text-muted"}`}
                            >
                              {money(outstanding)}
                            </Td>
                            <Td align="right">
                              <div className="flex items-center justify-end gap-2">
                                <StatusPill tone={tone}>{percent(c.repaymentRate, 1)}</StatusPill>
                                <div className="w-14">
                                  <Meter
                                    value={c.repaymentRate}
                                    tone={tone === "ok" ? "accent" : tone}
                                  />
                                </div>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </tbody>
                </TableWrap>
              </Card>

              <Card title="Team" description="Accounts by role and department" bodyClassName="">
                <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  <DistributionList
                    title="By role"
                    rows={(stats.charts?.roleDistribution || []).map((r) => ({
                      label: r.role === "admin" ? "Administrator" : titleCase(r.role),
                      value: r.count,
                    }))}
                    total={stats.users}
                  />
                  <DistributionList
                    title="By department"
                    rows={(stats.charts?.departmentDistribution || []).map((r) => ({
                      label: titleCase(r.department || "unassigned"),
                      value: r.count,
                    }))}
                    total={stats.users}
                  />
                </div>
              </Card>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function ChartEmpty({ children }) {
  return (
    <div className="flex h-48 items-center justify-center text-[13px] text-muted">{children}</div>
  );
}

function RateBlock({ label, value, note, good, fair, invert }) {
  const tone = invert
    ? value === 0
      ? "accent"
      : value <= 10
        ? "warn"
        : "danger"
    : good
      ? "accent"
      : fair
        ? "warn"
        : "danger";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] text-ink-2">{label}</span>
        <span className="tnum text-[13px] font-medium text-ink">{percent(value)}</span>
      </div>
      <Meter value={value} tone={tone} />
      <p className="mt-1.5 text-xs text-muted">{note}</p>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="tnum text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

function DistributionList({ title, rows, total }) {
  return (
    <div className="p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">Nothing to show.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] text-ink-2">{row.label}</span>
                <span className="tnum text-[13px] text-ink">{count(row.value)}</span>
              </div>
              <Meter value={total > 0 ? (row.value / total) * 100 : 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
