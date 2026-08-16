"use client";

import AppShell from "../../components/AppShell";
import CompaniesPage from "../../components/pages/CompaniesPage";

const ALLOW = ["manager"];

export default function ManagerCompaniesRoute() {
  return (
    <AppShell allow={ALLOW}>
      <CompaniesPage canEdit />
    </AppShell>
  );
}
