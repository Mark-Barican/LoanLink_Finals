"use client";

import AppShell from "../../components/AppShell";
import UsersPage from "../../components/pages/UsersPage";

const ALLOW = ["admin"];
const ASSIGNABLE = ["staff", "manager", "admin"];

export default function AdminUsersRoute() {
  return (
    <AppShell allow={ALLOW}>
      <UsersPage
        endpoint="/api/users"
        title="Users"
        description="Every account with access to LoanLink."
        assignableRoles={ASSIGNABLE}
        addLabel="Add user"
      />
    </AppShell>
  );
}
