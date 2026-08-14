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
          "relative rounded-xl border transition-all duration-200",
          focused ? "border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-white/15 hover:border-white/25",
          error && !focused && "border-red-500/60",
        )}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-3.5 origin-left transition-all duration-200 select-none",
            float ? "top-1.5 text-[11px] font-medium text-white/50" : "top-1/2 -translate-y-1/2 text-sm text-white/40",
            focused && "text-blue-400",
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
            "h-14 w-full rounded-xl bg-transparent px-3.5 pt-5 pb-1.5 text-sm text-white outline-none placeholder:text-transparent",
            toggleable && "pr-11",
            className,
          )}
          style={{
            caretColor: '#ffffff',
          } as React.CSSProperties}
        />
        {toggleable && (
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="fade-in-soft mt-1.5 pl-1 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}