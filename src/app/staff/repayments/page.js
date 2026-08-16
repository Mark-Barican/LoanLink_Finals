"use client";

import AppShell from "../../components/AppShell";
import RepaymentsPage from "../../components/pages/RepaymentsPage";

const ALLOW = ["staff"];

export default function StaffRepaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <RepaymentsPage basePath="/staff" canEdit />
    </AppShell>
  );
}
