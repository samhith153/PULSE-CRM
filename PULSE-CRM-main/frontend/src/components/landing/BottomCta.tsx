import { ArrowRight } from "lucide-react";
import { PillButton } from "./PillButton";
import { useReveal } from "@/hooks/use-reveal";

export interface BottomCtaProps {
  onOpenSignUp: () => void;
}

export function BottomCta({ onOpenSignUp }: BottomCtaProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="mesh-hero bg-ink-band py-28 md:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
        <div className="mesh-blob drift-b -bottom-40 -left-20 size-[36rem] bg-brand-purple" />
        <div className="mesh-blob drift-c -top-32 right-0 size-[32rem] bg-brand-blue" />
      </div>
      <div
        ref={ref}
        className="reveal relative mx-auto max-w-2xl px-6 text-center"
        data-visible={visible}
      >
        <h2 className="text-3xl leading-tight font-bold tracking-tight text-primary-foreground md:text-[2.75rem]">
          Give every rep an unfair advantage
        </h2>
        <p className="mt-5 text-base text-primary-foreground/80">
          Set up Pulse in an afternoon and watch your first scored pipeline land the same day.
        </p>
        <PillButton onClick={onOpenSignUp} size="lg" variant="light" className="arrow-nudge mt-9 cursor-pointer">
          Get started free <ArrowRight size={16} />
        </PillButton>
      </div>
    </section>
  );
}
