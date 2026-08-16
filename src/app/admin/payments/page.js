"use client";

import AppShell from "../../components/AppShell";
import PaymentsPage from "../../components/pages/PaymentsPage";

const ALLOW = ["admin"];

export default function AdminPaymentsRoute() {
  return (
    <AppShell allow={ALLOW}>
      <PaymentsPage basePath="/admin" canEdit />
    </AppShell>
  );
}
