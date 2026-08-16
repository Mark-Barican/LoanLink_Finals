"use client";

const KEY = "user";

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && user.role ? user : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("loanlink:session"));
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("loanlink:session"));
}

/** Where each role lands after signing in. */
export function homeFor(role) {
  if (role === "manager") return "/manager/dashboard";
  if (role === "staff") return "/staff";
  return "/admin";
}

/**
 * Every API route authorises on the x-user-role header, so all requests go
 * through here rather than each page assembling headers by hand.
 */
export async function api(path, { method = "GET", body, role } = {}) {
  const actingRole = role || getUser()?.role;
  const headers = { "Content-Type": "application/json" };
  if (actingRole) headers["x-user-role"] = actingRole;

  const res = await fetch(path, {
    method,
    headers,
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload?.error || `Request failed (${res.status} ${res.statusText || "error"})`;
    const error = new Error(message);
    error.status = res.status;
    error.details = payload?.details;
    throw error;
  }

  return payload;
}
