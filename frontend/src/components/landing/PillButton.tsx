import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export const pillVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        dark: "bg-ink text-background hover:-translate-y-0.5 hover:shadow-nav",
        light:
          "bg-background text-ink hover:-translate-y-0.5 hover:shadow-nav border border-transparent",
        outline: "border border-border bg-background text-ink hover:bg-secondary",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
);

export function PillButton({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof pillVariants>) {
  return <button className={cn(pillVariants({ variant, size }), className)} {...props} />;
}
