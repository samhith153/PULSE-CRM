import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import { AuthVisual } from "./AuthVisual";
import Galaxy from "@/components/ui/Galaxy";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 py-12 overflow-hidden">
      {/* Galaxy background spanning the entire screen */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.4}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          transparent={true}
        />
      </div>

      {/* Dim vignette over the starfield so the form stays the focal point */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 40%, rgba(2,6,23,0.28) 0%, rgba(2,6,23,0.66) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Link href="/" className="rise-in inline-flex items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-color text-text-on-primary shadow-[0_8px_18px_-8px_var(--accent-color)]">
              <Zap size={18} strokeWidth={2.6} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-100 animate-pulse-subtle">Pulse CRM</span>
          </Link>
        </div>

        {/* Glassmorphic card sitting nicely above the background */}
        <div 
          className="w-full rounded-[24px] p-8 sm:p-9 border border-white/15 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]"
          style={{ 
            background: 'rgba(255, 255, 255, 0.09)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-indigo-500 active:translate-y-0 active:scale-[0.98] disabled:opacity-80 transition-all duration-300 cursor-pointer"
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        children
      )}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-white/40">or</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}