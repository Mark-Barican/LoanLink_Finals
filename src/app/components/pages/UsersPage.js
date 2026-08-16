"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  PageHeader,
  RowActions,
  SearchInput,
  Select,
  Spinner,
  Stat,
  StatRow,
  StatusPill,
  TableEmpty,
  TableLoading,
  TableWrap,
  Td,
  Th,
  Tr,
} from "../ui";
import { api, getUser } from "@/lib/session";
import { DEPARTMENTS, count, date, titleCase } from "@/lib/format";

const EMPTY_FORM = {
  id: null,
  email: "",
  password: "",
  role: "staff",
  department: "operations",
};

const roleTone = { admin: "danger", manager: "warn", staff: "quiet" };

/**
 * Account management. Admins run this against /api/users for every role;
 * managers run the same screen against /api/staff, which the API restricts to
 * staff accounts only.
 */
export default function UsersPage({
  endpoint,
  title,
  description,
  assignableRoles,
  addLabel = "Add user",
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const signedInId = getUser()?.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api(endpoint);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!needle) return true;
      return [u.email, u.role, u.department]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      manager: users.filter((u) => u.role === "manager").length,
      staff: users.filter((u) => u.role === "staff").length,
    }),
    [users]
  );

  function openCreate() {
    setForm({ ...EMPTY_FORM, role: assignableRoles[0] });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(user) {
    setForm({
      id: user.id,
      email: user.email || "",
      password: "",
      role: user.role || "staff",
      department: user.department || "operations",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.id && form.password.length < 8) {
      setFormError("Set a password of at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        email: form.email.trim(),
        role: form.role,
        department: form.department,
      };
      if (form.id) {
        body.id = form.id;
      } else {
        body.password = form.password;
      }

      await api(endpoint, { method: form.id ? "PUT" : "POST", body });

      setFormOpen(false);
      setNotice(form.id ? `Updated ${body.email}.` : `Created ${body.email}.`);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.email}? They will lose access immediately.`)) return;

    setError("");
    try {
      await api(endpoint, { method: "DELETE", body: { id: user.id } });
      setNotice(`Deleted ${user.email}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const showRoleFilter = assignableRoles.length > 1;

  return (
    <>
      <PageHeader title={title} description={description}>
        <Button onClick={load} disabled={loading}>
          {loading ? <Spinner /> : null}
          Refresh
        </Button>
        <Button variant="primary" onClick={openCreate}>
          {addLabel}
        </Button>
      </PageHeader>

      {error ? <Banner tone="danger" onDismiss={() => setError("")}>{error}</Banner> : null}
      {notice ? <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner> : null}

      {showRoleFilter ? (
        <StatRow>
          <Stat label="Accounts" value={count(stats.total)} />
          <Stat label="Administrators" value={count(stats.admin)} />
          <Stat label="Managers" value={count(stats.manager)} />
          <Stat label="Staff" value={count(stats.staff)} />
        </StatRow>
      ) : (
        <StatRow cols={2}>
          <Stat label="Staff accounts" value={count(stats.total)} />
          <Stat
            label="Departments covered"
            value={count(new Set(users.map((u) => u.department).filter(Boolean)).size)}
          />
        </StatRow>
      )}

      <Card bodyClassName="">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 no-print">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or department"
            className="w-full sm:w-72"
          />
          {showRoleFilter ? (
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="all">All roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </Select>
          ) : null}
          <span className="tnum ml-auto text-xs text-muted">
            {filtered.length} of {users.length}
          </span>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Created</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoading colSpan={5} label="Loading accounts" />
            ) : filtered.length === 0 ? (
              <TableEmpty colSpan={5}>
                {users.length === 0 ? "No accounts yet." : "No accounts match this search."}
              </TableEmpty>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === signedInId;
                return (
                  <Tr key={u.id}>
                    <Td>
                      <span className="text-ink">{u.email}</span>
                      {isSelf ? <span className="ml-2 text-xs text-muted">You</span> : null}
                    </Td>
                    <Td>
                      <StatusPill tone={roleTone[u.role] || "quiet"}>
                        {titleCase(u.role)}
                      </StatusPill>
                    </Td>
                    <Td className="text-ink-2">{titleCase(u.department || "operations")}</Td>
                    <Td className="tnum text-muted">{date(u.created_at)}</Td>
                    <Td align="right">
                      <RowActions>
                        <Button size="sm" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          title={isSelf ? "You cannot delete your own account" : undefined}
                        >
                          Delete
                        </Button>
                      </RowActions>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit account" : addLabel}
        description={form.id ? form.email : "The account can sign in as soon as it is created."}
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {formError ? <Banner tone="danger">{formError}</Banner> : null}

            <Field label="Email address" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="person@company.com"
                required
              />
            </Field>

            {form.id ? (
              <Banner tone="info">
                Passwords cannot be changed here. The account holder signs in with their existing
                password.
              </Banner>
            ) : (
              <Field label="Password" required hint="8 characters or more">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </Field>
            )}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Role">
                <Select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  disabled={assignableRoles.length === 1}
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role === "admin" ? "Administrator" : titleCase(role)}
                    </option>
                  ))}
                  {form.id && !assignableRoles.includes(form.role) ? (
                    <option value={form.role}>{titleCase(form.role)}</option>
                  ) : null}
                </Select>
              </Field>

              <Field label="Department">
                <Select
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d === "it" ? "IT and Technology" : titleCase(d)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Create account"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
