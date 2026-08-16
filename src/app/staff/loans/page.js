"use client";

import AppShell from "../../components/AppShell";
import LoansPage from "../../components/pages/LoansPage";

const ALLOW = ["staff"];

export default function StaffLoansRoute() {
  return (
    <AppShell allow={ALLOW}>
      <LoansPage basePath="/staff" canEdit={false} />
    </AppShell>
  );
}
