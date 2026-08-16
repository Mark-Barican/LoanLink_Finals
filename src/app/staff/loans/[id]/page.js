"use client";

import { use } from "react";
import AppShell from "../../../components/AppShell";
import LoanDetailPage from "../../../components/pages/LoanDetailPage";

const ALLOW = ["staff"];

export default function StaffLoanDetailRoute({ params }) {
  const { id } = use(params);

  // Staff cannot change loan terms, but recording collections is their job,
  // which the payments API allows for every signed-in role.
  return (
    <AppShell allow={ALLOW}>
      <LoanDetailPage loanId={id} basePath="/staff" canEdit />
    </AppShell>
  );
}
