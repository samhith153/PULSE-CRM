import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  toggleable?: boolean;
};

export function AuthField({ label, error, toggleable, className, ...props }: Props) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const filled = String(props.value ?? "").length > 0;
  const float = focused || filled;

  return (
    <div className={cn(error && "shake-x")}>
      <div
        className={cn(
          "relative rounded-xl border bg-background transition-all duration-200",
          focused ? "border-link ring-2 ring-link/15" : "border-border",
          error && !focused && "border-destructive/60",
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-3.5 origin-left text-muted-foreground transition-all duration-200",
            float ? "top-1.5 text-[11px] font-medium" : "top-1/2 -translate-y-1/2 text-sm",
            focused && "text-link",
          )}
        >
          {label}
        </label>
        <input
          id={id}
          {...props}
          type={toggleable ? (show ? "text" : "password") : props.type}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "h-14 w-full rounded-xl bg-transparent px-3.5 pt-5 pb-1.5 text-sm text-ink outline-none placeholder:text-transparent",
            toggleable && "pr-11",
            className,
          )}
        />
        {toggleable && (
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="fade-in-soft mt-1.5 pl-1 text-xs text-destructive/80">{error}</p>
      )}
    </div>
  );
}