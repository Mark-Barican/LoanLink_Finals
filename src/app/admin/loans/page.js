"use client";

import AppShell from "../../components/AppShell";
import LoansPage from "../../components/pages/LoansPage";

const ALLOW = ["admin"];

export default function AdminLoansRoute() {
  return (
    <AppShell allow={ALLOW}>
      <LoansPage basePath="/admin" canEdit />
    </AppShell>
  );
}
