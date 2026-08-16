"use client";

import AppShell from "../../components/AppShell";
import CompaniesPage from "../../components/pages/CompaniesPage";

const ALLOW = ["admin"];

export default function AdminCompaniesRoute() {
  return (
    <AppShell allow={ALLOW}>
      <CompaniesPage canEdit />
    </AppShell>
  );
}
