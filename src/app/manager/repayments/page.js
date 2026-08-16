"use client";

import AppShell from "../../components/AppShell";
import RepaymentsPage from "../../components/pages/RepaymentsPage";

const ALLOW = ["manager"];

export default function ManagerRepaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <RepaymentsPage basePath="/manager" canEdit />
    </AppShell>
  );
}
