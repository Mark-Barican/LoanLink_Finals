"use client";

import AppShell from "../../components/AppShell";
import LoansPage from "../../components/pages/LoansPage";

const ALLOW = ["manager"];

export default function ManagerLoansRoute() {
  return (
    <AppShell allow={ALLOW}>
      <LoansPage basePath="/manager" canEdit />
    </AppShell>
  );
}
