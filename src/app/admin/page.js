"use client";

import AppShell from "../components/AppShell";
import DashboardPage from "../components/pages/DashboardPage";

const ALLOW = ["admin"];

export default function AdminDashboardRoute() {
  return (
    <AppShell allow={ALLOW}>
      <DashboardPage basePath="/admin" role="admin" />
    </AppShell>
  );
}
