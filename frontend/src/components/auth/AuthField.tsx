import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  toggleable?: boolean;
  labelAction?: ReactNode;
};

export function AuthField({ label, error, toggleable, labelAction, className, ...props }: Props) {
  const id = useId();
  const [show, setShow] = useState(false);

  return (
    <div className={cn(error && "shake-x")}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="select-none text-[13px] font-medium text-white/70">
          {label}
        </label>
        {labelAction}
      </div>
      <div
        className={cn(
          "relative rounded-2xl border bg-slate-950/50 backdrop-blur-sm transition-all duration-200",
          "border-white/15 hover:border-white/25",
          "focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/20 focus-within:shadow-[0_0_20px_rgba(56,189,248,0.16)]",
          error && "border-red-500/60 focus-within:border-red-500/70 focus-within:ring-red-500/20 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.14)]",
        )}
      >
        <input
          id={id}
          {...props}
          type={toggleable ? (show ? "text" : "password") : props.type}
          className={cn(
            "h-[52px] w-full rounded-2xl bg-transparent px-4 text-[15px] text-white outline-none placeholder:text-white/35",
            "autofill:bg-transparent autofill:text-white",
            toggleable && "pr-11",
            className,
          )}
          style={{
            caretColor: "#ffffff",
            boxShadow: "0 0 0 1000px rgba(2,6,23,0.5) inset",
            WebkitBoxShadow: "0 0 0 1000px rgba(2,6,23,0.5) inset",
            WebkitTextFillColor: "#ffffff",
            transition: "background-color 5000s ease-in-out 0s",
          } as React.CSSProperties}
        />
        {toggleable && (
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
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