"use client";

import AppShell from "../../components/AppShell";
import RepaymentsPage from "../../components/pages/RepaymentsPage";

const ALLOW = ["admin"];

export default function AdminRepaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <RepaymentsPage basePath="/admin" canEdit />
    </AppShell>
  );
}
