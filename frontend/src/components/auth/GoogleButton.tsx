'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAuthConfig, loginWithGoogle, setToken, getCurrentUser } from "@/utils/api";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.39 3.6v3h3.86c2.26-2.08 3.58-5.15 3.58-8.78Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.98-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.62l3.98 3.1C6.21 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gsiReady, setGsiReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGoogleCallback = useCallback(async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setError("");
    try {
      const result = await loginWithGoogle(response.credential);
      setToken(result.access_token);

      const user = await getCurrentUser();
      const primaryRole =
        user.roles && user.roles.length > 0 ? user.roles[0] : "sales_rep";

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pulse-crm-auth", "true");
        localStorage.setItem("pulse-crm-role", primaryRole);
        localStorage.setItem("pulse-crm-user", user.full_name || "Google User");
      }

      let redirectPath = "/dashboard";
      if (primaryRole === "admin") {
        redirectPath = "/dashboard/admin";
      } else if (primaryRole === "manager") {
        redirectPath = "/dashboard/manager";
      }

      router.push(redirectPath);
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError(err.message || "Google Sign-In failed.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getAuthConfig()
      .then((config) => {
        if (config.google_client_id) {
          setGoogleClientId(config.google_client_id);
        }
      })
      .catch((err) => console.error("Failed to load auth config:", err));
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    const id = "google-gsi-client";
    let script = document.getElementById(id) as HTMLScriptElement;

    const initializeGoogleSignIn = () => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
        setGsiReady(true);
        if (containerRef.current) {
          g.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            width: 316,
            text: "continue_with",
          });
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      setTimeout(initializeGoogleSignIn, 50);
    }
  }, [googleClientId, handleGoogleCallback]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="flex min-h-[44px] w-full items-center justify-center"
      />
      {!googleClientId && (
        <>
          <button
            type="button"
            disabled
            aria-label={label}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/40 cursor-not-allowed opacity-60"
          >
            <GoogleIcon />
            <span>{label}</span>
          </button>
          <p className="text-center text-[11px] text-white/40">
            Google Sign-In is not configured on the server.
          </p>
        </>
      )}
      {loading && !gsiReady && (
        <button
          type="button"
          disabled
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/90"
        >
          <Loader2 size={16} className="animate-spin text-accent-color" />
          <span>Loading...</span>
        </button>
      )}
      {error && (
        <p className="text-center text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}
