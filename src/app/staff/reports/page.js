"use client";

import AppShell from "../../components/AppShell";
import ReportsPage from "../../components/pages/ReportsPage";

const ALLOW = ["staff"];

export default function StaffReportsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <ReportsPage variant="basic" />
    </AppShell>
  );
}
