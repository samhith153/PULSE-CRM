import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthDivider, AuthSubmit } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { redirectToDashboard, type UserRole } from "@/lib/auth";
import { apiRegister, getCurrentUser, setToken } from "@/lib/api";
import { AlertCircle } from "lucide-react";

const title = "Create your Pulse CRM account";
const description =
  "Sign up for Pulse CRM and start capturing, scoring, and closing more leads in minutes — no credit card required.";

export const Route = createFileRoute("/_auth/signup")({
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
  component: SignUpPage,
});

function strengthOf(pw: string) {
  if (pw.length === 0) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak" };
  if (score <= 3) return { level: 2, label: "Medium" };
  return { level: 3, label: "Strong" };
}

function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your full name.";
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
      // Use the company name field if filled, otherwise derive from email domain
      const org = orgName.trim() || email.trim().split("@")[1]?.split(".")[0] || "My Company";
      const tokens = await apiRegister(name.trim(), email.trim(), password, org);
      setToken(tokens.access_token);

      const user = await getCurrentUser();
      const primaryRole = (user.roles?.[0] as UserRole | undefined) ?? role;

      sessionStorage.setItem("pulse-crm-auth", "true");
      localStorage.setItem("pulse-crm-role", primaryRole);
      localStorage.setItem("pulse-crm-user", user.full_name ?? "");

      redirectToDashboard(primaryRole, user.email, tokens.access_token);
    } catch (err: any) {
      setApiError(err?.message ?? "Sign up failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fade-in-soft">
      <h1
        className="rise-in text-2xl font-bold tracking-tight text-ink"
        style={{ animationDelay: "60ms" }}
      >
        Create your account
      </h1>
      <p
        className="rise-in mt-2 text-sm leading-relaxed text-muted-foreground"
        style={{ animationDelay: "120ms" }}
      >
        Start closing more deals in minutes — no credit card required.
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

      {/* Google Sign-Up */}
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
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
        </div>
        <div className="rise-in" style={{ animationDelay: "290ms" }}>
          <AuthField
            label="Company name (optional)"
            autoComplete="organization"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <div className="rise-in" style={{ animationDelay: "320ms" }}>
          <AuthField
            label="Work email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
        </div>
        <div className="rise-in" style={{ animationDelay: "350ms" }}>
          <AuthField
            label="Password"
            toggleable
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          {/* Password strength bar */}
          <div className="mt-2 flex items-center gap-2 px-1">
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    strength.level >= i ? "bg-ink" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="w-14 text-right text-[11px] text-muted-foreground">
              {strength.label}
            </span>
          </div>
        </div>

        <div className="rise-in pt-2" style={{ animationDelay: "390ms" }}>
          <AuthSubmit loading={loading}>Create account</AuthSubmit>
        </div>
      </form>

      <p
        className="rise-in mt-5 text-center text-sm text-muted-foreground"
        style={{ animationDelay: "430ms" }}
      >
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-link hover:underline">
          Sign in
        </Link>
      </p>

      <p
        className="rise-in mt-8 text-center text-xs leading-relaxed text-muted-foreground"
        style={{ animationDelay: "460ms" }}
      >
        By continuing, you agree to Pulse's{" "}
        <a href="#" className="text-link hover:underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="text-link hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
