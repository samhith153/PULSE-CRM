import { useEffect, useState, useCallback, useRef } from "react";

/** Reveals an element once it scrolls into view. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const [element, setElement] = useState<T | null>(null);
  const [visible, setVisible] = useState(false);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(element);
    return () => io.disconnect();
  }, [element, threshold]);

  return { ref, visible };
}

export function useCountUp(target: number, duration = 1000) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.15);
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    const startVal = prevTargetRef.current;
    const diff = target - startVal;
    
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      setValue(Math.round(startVal + diff * eased));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevTargetRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, target, duration]);

  return { ref, value, visible };
}
