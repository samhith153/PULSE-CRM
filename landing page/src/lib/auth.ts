export type UserRole = "admin" | "manager" | "representative" | "sales_rep";

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full system access & user management" },
  { value: "manager", label: "Manager", description: "Team pipeline & performance views" },
  { value: "representative", label: "Sales Rep", description: "Personal leads, deals & tasks" },
];

const DASHBOARD_URL =
  (import.meta.env.VITE_DASHBOARD_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Map backend roles (sales_rep / representative / admin / manager)
 * to the exact path the Next.js dashboard expects.
 */
function roleToDashboardPath(role: UserRole): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "manager") return "/dashboard/manager";
  // sales_rep or representative → rep dashboard
  return "/dashboard";
}

/**
 * Normalise backend role strings to what DashboardShell expects in localStorage.
 */
function normaliseRole(role: UserRole): string {
  if (role === "representative") return "sales_rep";
  return role; // "admin" | "manager" | "sales_rep" pass through unchanged
}

export function redirectToDashboard(role: UserRole, email?: string, token?: string) {
  const normalisedRole = normaliseRole(role);
  const path = roleToDashboardPath(role);

  // Pass auth state via URL query params so DashboardShell's useEffect picks it up.
  // The token is included so the Next.js app (different origin/port) can store it
  // in its own sessionStorage — sessionStorage does NOT cross origins.
  const params = new URLSearchParams({
    auth: "true",
    role: normalisedRole,
  });
  if (email?.trim()) params.set("email", email.trim());
  if (token?.trim()) params.set("token", token.trim());

  window.location.href = `${DASHBOARD_URL}${path}?${params.toString()}`;
}
