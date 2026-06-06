import { useCallback, useEffect, useState } from "react";
import type { LessonBlockRecord } from "../../shared/api/lesson";
import { STUDENT_SCROLL_ROOT_ID } from "../../shared/constants/scrollRoots";
import { getLessonBlockDomId } from "../lessonReaderUtils";

type UseLessonReaderScrollOptions = {
  blocks: LessonBlockRecord[];
  enabled: boolean;
  onProgress?: (activeBlockId: string | null, scrollPercent: number) => void;
};

function getScrollRoot(): HTMLElement | null {
  return document.getElementById(STUDENT_SCROLL_ROOT_ID);
}

function getElementTopInRoot(el: HTMLElement, root: HTMLElement): number {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - rootRect.top + root.scrollTop;
}

export function useLessonReaderScroll({ blocks, enabled, onProgress }: UseLessonReaderScrollOptions) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(blocks[0]?.id ?? null);

  const scrollToBlock = useCallback((blockId: string) => {
    const root = getScrollRoot();
    const el = document.getElementById(getLessonBlockDomId(blockId));
    if (!el || !root) return;
    const top = getElementTopInRoot(el, root) - 12;
    root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!enabled || blocks.length === 0) return;

    const root = getScrollRoot();
    if (!root) return;

    const updateProgress = () => {
      const maxScroll = root.scrollHeight - root.clientHeight;
      const pct = maxScroll > 8 ? Math.min(100, Math.max(0, (root.scrollTop / maxScroll) * 100)) : 0;
      setScrollProgress(pct);
    };

    const pickActiveSection = () => {
      const marker = root.scrollTop + root.clientHeight * 0.35;
      let current = blocks[0]?.id ?? null;
      for (const block of blocks) {
        const el = document.getElementById(getLessonBlockDomId(block.id));
        if (!el) continue;
        if (getElementTopInRoot(el, root) <= marker) current = block.id;
      }
      setActiveBlockId(current);
    };

    const onScroll = () => {
      updateProgress();
      pickActiveSection();
      notifyProgress();
    };

    const notifyProgress = () => {
      if (!onProgress) return;
      const maxScroll = root.scrollHeight - root.clientHeight;
      const pct = maxScroll > 8 ? Math.min(100, Math.max(0, (root.scrollTop / maxScroll) * 100)) : 0;
      let current = blocks[0]?.id ?? null;
      const marker = root.scrollTop + root.clientHeight * 0.35;
      for (const block of blocks) {
        const el = document.getElementById(getLessonBlockDomId(block.id));
        if (!el) continue;
        if (getElementTopInRoot(el, root) <= marker) current = block.id;
      }
      onProgress(current, pct);
    };

    updateProgress();
    pickActiveSection();
    notifyProgress();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const blockIds = blocks.map((b) => b.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const top = visible[0];
        if (top?.target?.id) {
          const id = top.target.id.replace(/^lesson-block-/, "");
          if (blockIds.includes(id)) setActiveBlockId(id);
        }
      },
      { root, rootMargin: "-8% 0px -50% 0px", threshold: [0, 0.15, 0.4, 0.75] },
    );

    for (const block of blocks) {
      const el = document.getElementById(getLessonBlockDomId(block.id));
      if (el) observer.observe(el);
    }

    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, [blocks, enabled, onProgress]);

  return { scrollProgress, activeBlockId, scrollToBlock };
}
