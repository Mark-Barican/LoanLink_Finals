"use client";

import AppShell from "../../components/AppShell";
import ReportsPage from "../../components/pages/ReportsPage";

const ALLOW = ["manager"];

export default function ManagerReportsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <ReportsPage variant="full" />
    </AppShell>
  );
}
