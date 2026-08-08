import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiLoginWithGoogle, getCurrentUser, setToken } from "@/lib/api";
import { redirectToDashboard, type UserRole } from "@/lib/auth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.39 3.6v3h3.86c2.26-2.08 3.58-5.15 3.58-8.78Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.26 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.98-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.62l3.98 3.1C6.21 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

interface GoogleButtonProps {
  label: string;
  role: UserRole;
  onError?: (msg: string) => void;
}

export function GoogleButton({ label, role, onError }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  // ── Handle the credential returned by Google ──────────────────────────
  async function handleCredential(response: { credential: string }) {
    setLoading(true);
    try {
      const tokens = await apiLoginWithGoogle(response.credential);
      setToken(tokens.access_token);

      const user = await getCurrentUser();
      const primaryRole = (user.roles?.[0] as UserRole | undefined) ?? role;

      // Persist auth state so the dashboard can pick it up
      sessionStorage.setItem("pulse-crm-auth", "true");
      localStorage.setItem("pulse-crm-role", primaryRole);
      localStorage.setItem("pulse-crm-user", user.full_name ?? "");

      redirectToDashboard(primaryRole, user.email, tokens.access_token);
    } catch (err: any) {
      setLoading(false);
      const msg: string = err?.message ?? "Google Sign-In failed. Please try again.";
      onError?.(msg);
    }
  }

  // ── Load GSI script and initialise ───────────────────────────────────
  useEffect(() => {
    if (!CLIENT_ID) {
      setUnavailable(true);
      return;
    }
    if (initialised.current) return;

    function init() {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        ux_mode: "popup",
        context: "signin",
      });

      // Render the branded button inside our custom wrapper
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        g.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: containerRef.current.offsetWidth || 380,
          logo_alignment: "center",
        });
      }

      initialised.current = true;
    }

    const scriptId = "gsi-client";
    if (document.getElementById(scriptId)) {
      // Script already in DOM — just init
      setTimeout(init, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => setUnavailable(true);
    document.head.appendChild(script);
  }, [CLIENT_ID]);

  // ── Fallback: CLIENT_ID not set ───────────────────────────────────────
  if (unavailable) {
    return (
      <button
        type="button"
        disabled
        className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full border border-border bg-background text-sm font-medium text-muted-foreground opacity-60"
        title="Google Sign-In is not configured"
      >
        <GoogleIcon />
        {label}
      </button>
    );
  }

  // ── While GSI renders its own button, show a loading placeholder ──────
  return (
    <div className="relative w-full">
      {/* GSI renders its own iframe button into this div */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-full"
        style={{ minHeight: 48 }}
      />
      {/* Show our own spinner overlay while the API call is in-flight */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Signing in…</span>
        </div>
      )}
    </div>
  );
}
