import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import { AuthVisual } from "./AuthVisual";
import Antigravity from "@/components/ui/Antigravity";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-warm flex flex-col justify-center items-center px-4 sm:px-6 py-12 overflow-hidden">
      {/* Antigravity background spanning the entire screen */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Antigravity
          count={250}
          magnetRadius={10}
          ringRadius={9}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#131ed7"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0.1}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-[400px]">
        <div className="flex justify-center mb-6">
          <Link href="/" className="rise-in inline-flex items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-color text-text-on-primary shadow-[0_8px_18px_-8px_var(--accent-color)]">
              <Zap size={18} strokeWidth={2.6} />
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary animate-pulse-subtle">Pulse CRM</span>
          </Link>
        </div>

        {/* Card sitting nicely above the background */}
        <div className="w-full rounded-3xl bg-white/92 p-7 shadow-xl border border-gray-100/50 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthSubmit({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nav active:translate-y-0 active:scale-[0.98] disabled:opacity-80"
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-background/40 border-t-background" />
      ) : (
        children
      )}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}