import { useState } from "react";
import { Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      aria-label={label}
      aria-busy={loading}
      onClick={() => {
        setLoading(true);
        console.info("[auth] Google OAuth requested");
        setTimeout(() => setLoading(false), 1600);
      }}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border-default bg-surface-1 text-sm font-semibold text-text-primary transition-all duration-200 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-color focus-visible:ring-offset-2 outline-none active:scale-[0.985] disabled:opacity-70 cursor-pointer"
    >
      {loading ? <Loader2 size={16} className="animate-spin text-accent-color" /> : <GoogleIcon />}
      <span>{label}</span>
    </button>
  );
}