"use client";

import { use } from "react";
import AppShell from "../../../components/AppShell";
import LoanDetailPage from "../../../components/pages/LoanDetailPage";

const ALLOW = ["admin"];

export default function AdminLoanDetailRoute({ params }) {
  const { id } = use(params);

  return (
    <AppShell allow={ALLOW}>
      <LoanDetailPage loanId={id} basePath="/admin" canEdit />
    </AppShell>
  );
}
