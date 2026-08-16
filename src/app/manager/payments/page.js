"use client";

import AppShell from "../../components/AppShell";
import PaymentsPage from "../../components/pages/PaymentsPage";

const ALLOW = ["manager"];

export default function ManagerPaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <PaymentsPage basePath="/manager" canEdit />
    </AppShell>
  );
}
