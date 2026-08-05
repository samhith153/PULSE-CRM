import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthDivider, AuthSubmit } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { redirectToDashboard, type UserRole } from "@/lib/auth";
import { apiLogin, getCurrentUser, setToken } from "@/lib/api";
import { AlertCircle } from "lucide-react";

const title = "Sign in to Pulse CRM";
const description =
  "Sign in to Pulse CRM to pick up right where you left off — scored leads, live pipeline, and AI next best actions.";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = "Enter a valid work email address.";
    if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    setFieldErrors({});
    if (Object.keys(next).length) {
      requestAnimationFrame(() => setFieldErrors(next));
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const tokens = await apiLogin(email.trim(), password);
      setToken(tokens.access_token);

      const user = await getCurrentUser();
      const primaryRole = (user.roles?.[0] as UserRole | undefined) ?? role;

      sessionStorage.setItem("pulse-crm-auth", "true");
      localStorage.setItem("pulse-crm-role", primaryRole);
      localStorage.setItem("pulse-crm-user", user.full_name ?? "");

      redirectToDashboard(primaryRole, user.email, tokens.access_token);
    } catch (err: any) {
      setApiError(err?.message ?? "Sign in failed. Please check your credentials.");
      setLoading(false);
    }
  }

  return (
    <div className="fade-in-soft">
      <h1
        className="rise-in text-2xl font-bold tracking-tight text-ink"
        style={{ animationDelay: "60ms" }}
      >
        Welcome back
      </h1>
      <p
        className="rise-in mt-2 text-sm leading-relaxed text-muted-foreground"
        style={{ animationDelay: "120ms" }}
      >
        Sign in to pick up right where you left off.
      </p>

      <div className="rise-in mt-7" style={{ animationDelay: "180ms" }}>
        <RoleSelector value={role} onChange={setRole} />
      </div>

      {/* API-level error banner */}
      {apiError && (
        <div className="rise-in mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-xs font-medium text-destructive">{apiError}</p>
        </div>
      )}

      {/* Google Sign-In */}
      <div className="rise-in mt-5" style={{ animationDelay: "200ms" }}>
        <GoogleButton
          label="Continue with Google"
          role={role}
          onError={setApiError}
        />
      </div>

      <div className="rise-in" style={{ animationDelay: "220ms" }}>
        <AuthDivider />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div className="rise-in" style={{ animationDelay: "260ms" }}>
          <AuthField
            label="Work email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
        </div>
        <div className="rise-in" style={{ animationDelay: "300ms" }}>
          <div className="mb-1.5 flex justify-end">
            <a href="#" className="text-xs font-medium text-link hover:underline">
              Forgot password?
            </a>
          </div>
          <AuthField
            label="Password"
            toggleable
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
        </div>

        <div className="rise-in pt-2" style={{ animationDelay: "340ms" }}>
          <AuthSubmit loading={loading}>
            Sign in as{" "}
            {role === "representative"
              ? "Sales Rep"
              : role.charAt(0).toUpperCase() + role.slice(1)}
          </AuthSubmit>
        </div>
      </form>

      <p
        className="rise-in mt-5 text-center text-sm text-muted-foreground"
        style={{ animationDelay: "380ms" }}
      >
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-link hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
