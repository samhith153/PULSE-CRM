import Link from "next/link";
import type { ReactNode } from "react";
import { AuthVisual } from "./AuthVisual";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-warm lg:grid lg:grid-cols-[minmax(0,47fr)_minmax(0,53fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <Link href="/" className="rise-in inline-flex w-fit items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-background">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">Pulse CRM</span>
        </Link>

        <div className="mesh-hero relative mt-6 h-24 overflow-hidden rounded-2xl lg:hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="mesh-blob drift-a -top-16 -left-8 size-64 bg-brand-purple" />
            <div className="mesh-blob drift-b top-0 left-1/2 size-56 bg-brand-cyan" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <AuthVisual />
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