"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_PHRASES = ["action.", "priority.", "revenue.", "momentum."];

const HOLD_MS = 2600;

type CyclingPhraseProps = {
  className?: string;
  phrases?: string[];
  interval?: number;
};

export function CyclingPhrase({ className, phrases = DEFAULT_PHRASES, interval }: CyclingPhraseProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const hold = interval ?? HOLD_MS;
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), phrases[0]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, hold + 750);
    return () => window.clearInterval(id);
  }, [phrases.length, hold]);

  return (
    <span className={`relative inline-block align-baseline ${className ?? ""}`}>
      {/* invisible spacer reserves space for the longest phrase */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      <span className="absolute inset-0 flex items-start justify-start">
        <AnimatePresence initial={false}>
          <motion.span
            key={phrases[index]}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: "0.35em", filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: "-0.3em", filter: "blur(6px)" }
            }
            transition={{ duration: reduceMotion ? 0.3 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pl-grad-text whitespace-nowrap"
          >
            {phrases[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
