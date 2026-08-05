import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";
import { ROLES } from "@/lib/auth";

type RoleSelectorProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold tracking-widest text-ink uppercase">Sign in as</p>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((role) => {
          const selected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-center transition-all duration-200",
                selected
                  ? "border-ink bg-ink text-background shadow-nav"
                  : "border-border bg-background text-ink hover:border-ink/40 hover:bg-secondary",
              )}
            >
              <span className="block text-xs font-semibold">{role.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {ROLES.find((r) => r.value === value)?.description}
      </p>
    </div>
  );
}
