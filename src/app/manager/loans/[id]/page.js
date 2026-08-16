"use client";

import { use } from "react";
import AppShell from "../../../components/AppShell";
import LoanDetailPage from "../../../components/pages/LoanDetailPage";

const ALLOW = ["manager"];

export default function ManagerLoanDetailRoute({ params }) {
  const { id } = use(params);

  return (
    <AppShell allow={ALLOW}>
      <LoanDetailPage loanId={id} basePath="/manager" canEdit />
    </AppShell>
  );
}
