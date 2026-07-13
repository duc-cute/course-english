import { useEffect, useRef, useState } from "react";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Eases displayed progress toward the target each frame (scroll / audio feel fluid).
 */
export function useSmoothProgress(target: number, enabled = true): number {
  const [display, setDisplay] = useState(() => clamp01(target));
  const displayRef = useRef(display);
  const rafRef = useRef(0);

  useEffect(() => {
    const goal = clamp01(target);

    if (!enabled) {
      displayRef.current = goal;
      setDisplay(goal);
      return;
    }

    let running = true;

    const tick = () => {
      if (!running) return;

      const current = displayRef.current;
      const diff = goal - current;

      if (Math.abs(diff) < 0.0008) {
        if (current !== goal) {
          displayRef.current = goal;
          setDisplay(goal);
        }
        return;
      }

      const factor = Math.min(0.42, 0.1 + Math.abs(diff) * 0.55);
      const next = current + diff * factor;
      displayRef.current = next;
      setDisplay(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, enabled]);

  return enabled ? display : clamp01(target);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
