"use client";

import AppShell from "../../components/AppShell";
import PaymentsPage from "../../components/pages/PaymentsPage";

const ALLOW = ["staff"];

export default function StaffPaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <PaymentsPage basePath="/staff" canEdit />
    </AppShell>
  );
}
