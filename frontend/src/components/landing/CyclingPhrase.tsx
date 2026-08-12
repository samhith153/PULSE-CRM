import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const PHRASES = [
  "close more deals",
  "never miss a follow-up",
  "convert faster",
  "beat their quota",
];

const LONGEST = PHRASES.reduce((a, b) => (b.length > a.length ? b : a), PHRASES[0]);

const HOLD_MS = 2300;

export function CyclingPhrase({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
    }, HOLD_MS + 800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`relative inline-block align-top ${className ?? ""}`}>
      {/* invisible spacer reserves space for the longest phrase */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {LONGEST}
      </span>

      <span className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence initial={false}>
          <motion.span
            key={PHRASES[index]}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(10px) drop-shadow(0 0 14px oklch(0.8168 0.1193 205.31 / 0.6)) drop-shadow(0 0 32px oklch(0.5124 0.209 274.64 / 0.35))", scale: 1.05, y: 6 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, filter: "blur(0px) drop-shadow(0 0 14px oklch(0.8168 0.1193 205.31 / 0.6)) drop-shadow(0 0 32px oklch(0.5124 0.209 274.64 / 0.35))", scale: 1, y: 0 }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(8px) drop-shadow(0 0 14px oklch(0.8168 0.1193 205.31 / 0.6)) drop-shadow(0 0 32px oklch(0.5124 0.209 274.64 / 0.35))", scale: 0.97, y: -6 }
            }
            transition={{ duration: reduceMotion ? 0.3 : 0.8, ease: [0.42, 0, 0.58, 1] }}
            className="absolute whitespace-nowrap cycling-glow"
          >
            {PHRASES[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      
    </span>
  );
}
