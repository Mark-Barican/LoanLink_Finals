"use client";

import AppShell from "../components/AppShell";
import DashboardPage from "../components/pages/DashboardPage";

const ALLOW = ["staff"];

export default function StaffDashboardRoute() {
  return (
    <AppShell allow={ALLOW}>
      <DashboardPage basePath="/staff" role="staff" />
    </AppShell>
  );
}
