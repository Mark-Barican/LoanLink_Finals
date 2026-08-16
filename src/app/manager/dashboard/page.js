"use client";

import AppShell from "../../components/AppShell";
import DashboardPage from "../../components/pages/DashboardPage";

const ALLOW = ["manager"];

export default function ManagerDashboardRoute() {
  return (
    <AppShell allow={ALLOW}>
      <DashboardPage basePath="/manager" role="manager" />
    </AppShell>
  );
}
