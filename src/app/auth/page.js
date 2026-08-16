"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "../components/Sidebar";
import { Banner, Button, Field, Input, Select, Spinner } from "../components/ui";
import { getUser, setUser, homeFor } from "@/lib/session";
import { DEPARTMENTS, titleCase } from "@/lib/format";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const existing = getUser();
    if (existing) {
      router.replace(homeFor(existing.role));
      return;
    }
    setChecking(false);
  }, [router]);

  function handleAuthenticated(user) {
    setUser(user);
    router.replace(homeFor(user.role));
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner className="h-5 w-5 text-muted" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-6 flex justify-center">
            <Wordmark />
          </div>

          <div className="rounded-[6px] border border-line bg-canvas">
            <div className="flex border-b border-line" role="tablist">
              <TabButton
                active={mode === "signin"}
                onClick={() => setMode("signin")}
                label="Sign in"
              />
              <TabButton
                active={mode === "signup"}
                onClick={() => setMode("signup")}
                label="Create account"
              />
            </div>

            <div className="p-5">
              {mode === "signin" ? (
                <SignInForm onAuthenticated={handleAuthenticated} />
              ) : (
                <SignUpForm onAuthenticated={handleAuthenticated} />
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted">
            Loan portfolio and collections management
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 border-b-2 px-4 py-3 text-[13px] font-medium transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function SignInForm({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      onAuthenticated(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Field label="Email address">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="you@company.com"
          required
        />
      </Field>

      <Field label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />
      </Field>

      <Button type="submit" variant="primary" disabled={busy} className="w-full">
        {busy ? (
          <>
            <Spinner /> Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

function SignUpForm({ onAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "", department: "operations" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          role: "staff",
          department: form.department,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create the account");
        return;
      }

      onAuthenticated(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <Banner tone="danger">{error}</Banner> : null}

      <Field label="Email address">
        <Input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="username"
          placeholder="you@company.com"
          required
        />
      </Field>

      <Field label="Password" hint="8 characters or more">
        <Input
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          autoComplete="new-password"
          placeholder="Choose a password"
          required
        />
      </Field>

      <Field label="Department">
        <Select value={form.department} onChange={(e) => update("department", e.target.value)}>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {titleCase(d)}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" variant="primary" disabled={busy} className="w-full">
        {busy ? (
          <>
            <Spinner /> Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-xs text-muted">
        New accounts start with staff access. An administrator can change the role later.
      </p>
    </form>
  );
}
