import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthDivider, AuthSubmit } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";

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
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = "Enter a valid work email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors({});
    if (Object.keys(next).length) {
      requestAnimationFrame(() => setErrors(next));
      return;
    }
    setLoading(true);
    console.info("[auth] sign in submitted", { email: email.trim() });
    setTimeout(() => {
      setLoading(false);
      void navigate({ to: "/" });
    }, 1400);
  }

  return (
    <div className="fade-in-soft">
      <h1 className="rise-in text-2xl font-bold tracking-tight text-ink" style={{ animationDelay: "60ms" }}>
        Welcome back
      </h1>
      <p
        className="rise-in mt-2 text-sm leading-relaxed text-muted-foreground"
        style={{ animationDelay: "120ms" }}
      >
        Sign in to pick up right where you left off.
      </p>

      <div className="rise-in mt-7" style={{ animationDelay: "180ms" }}>
        <GoogleButton label="Continue with Google" />
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
            error={errors.email}
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
            error={errors.password}
          />
        </div>

        <div className="rise-in pt-2" style={{ animationDelay: "340ms" }}>
          <AuthSubmit loading={loading}>Sign in</AuthSubmit>
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