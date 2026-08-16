"use client";

import AppShell from "../../components/AppShell";
import CompaniesPage from "../../components/pages/CompaniesPage";

const ALLOW = ["staff"];

export default function StaffCompaniesRoute() {
  return (
    <AppShell allow={ALLOW}>
      <CompaniesPage canEdit={false} />
    </AppShell>
  );
}
