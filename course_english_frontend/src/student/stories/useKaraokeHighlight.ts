import { useEffect, useRef, useState } from "react";

export const KARAOKE_LEAVING_MS = 200;

/** Brief index of the word that just lost --active (crossfade). */
export function useLeavingWordIndex(
  activeWordIndex: number | null,
  enabled: boolean,
): number | null {
  const [leavingWordIndex, setLeavingWordIndex] = useState<number | null>(null);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLeavingWordIndex(null);
      prevRef.current = null;
      return;
    }

    const prev = prevRef.current;
    if (prev !== null && prev !== activeWordIndex) {
      setLeavingWordIndex(prev);
      const timer = window.setTimeout(() => setLeavingWordIndex(null), KARAOKE_LEAVING_MS);
      prevRef.current = activeWordIndex;
      return () => window.clearTimeout(timer);
    }

    prevRef.current = activeWordIndex;
  }, [activeWordIndex, enabled]);

  return leavingWordIndex;
}

export function getStoryScrollContainer(el: HTMLElement | null): HTMLElement | null {
  return el?.closest(".story-reader__center-panel") as HTMLElement | null;
}

/** Scroll only when the target is outside the middle comfort band (no jump). */
export function scrollIntoComfortZone(target: HTMLElement, container: HTMLElement): void {
  const targetRect = target.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const edgePadding = 56;
  const targetTop = targetRect.top;
  const targetBottom = targetRect.bottom;
  const visibleTop = containerRect.top + edgePadding;
  const visibleBottom = containerRect.bottom - edgePadding;

  if (targetTop >= visibleTop && targetBottom <= visibleBottom) {
    return;
  }

  const targetCenter = targetRect.top + targetRect.height / 2;
  const zoneTop = containerRect.top + containerRect.height * 0.38;
  const zoneBottom = containerRect.top + containerRect.height * 0.62;

  if (targetCenter >= zoneTop && targetCenter <= zoneBottom) {
    return;
  }

  const containerMid = containerRect.top + containerRect.height / 2;
  const maxScrollDown = container.scrollHeight - container.scrollTop - container.clientHeight;
  const maxScrollUp = container.scrollTop;
  let scrollDelta = targetCenter - containerMid;
  scrollDelta = Math.max(-maxScrollUp, Math.min(scrollDelta, maxScrollDown));

  if (Math.abs(scrollDelta) < 1) {
    if (targetBottom > visibleBottom) {
      scrollDelta = Math.min(targetBottom - visibleBottom, maxScrollDown);
    } else if (targetTop < visibleTop) {
      scrollDelta = -Math.min(visibleTop - targetTop, maxScrollUp);
    }
  }

  if (Math.abs(scrollDelta) < 1) return;
  container.scrollBy({ top: scrollDelta, behavior: "smooth" });
}
