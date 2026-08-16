"use client";

import AppShell from "../../components/AppShell";
import UsersPage from "../../components/pages/UsersPage";

const ALLOW = ["manager"];
const ASSIGNABLE = ["staff"];

export default function ManagerStaffRoute() {
  return (
    <AppShell allow={ALLOW}>
      <UsersPage
        endpoint="/api/staff"
        title="Staff"
        description="Staff accounts you can create and maintain."
        assignableRoles={ASSIGNABLE}
        addLabel="Add staff member"
      />
    </AppShell>
  );
}
