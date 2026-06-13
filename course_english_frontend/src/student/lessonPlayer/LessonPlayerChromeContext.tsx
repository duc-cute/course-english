import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type LessonPlayerChromeState = {
  progressPercent: number;
  progressHint: string;
  lessonTitle: string;
};

const defaultChrome: LessonPlayerChromeState = {
  progressPercent: 0,
  progressHint: "",
  lessonTitle: "",
};

type LessonPlayerChromeContextValue = {
  chrome: LessonPlayerChromeState;
  patchChrome: (patch: Partial<LessonPlayerChromeState>) => void;
  resetChrome: () => void;
};

const LessonPlayerChromeContext = createContext<LessonPlayerChromeContextValue | null>(null);

export function LessonPlayerChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<LessonPlayerChromeState>(defaultChrome);

  const patchChrome = useCallback((patch: Partial<LessonPlayerChromeState>) => {
    setChrome((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetChrome = useCallback(() => {
    setChrome(defaultChrome);
  }, []);

  const value = useMemo(
    () => ({ chrome, patchChrome, resetChrome }),
    [chrome, patchChrome, resetChrome],
  );

  return <LessonPlayerChromeContext.Provider value={value}>{children}</LessonPlayerChromeContext.Provider>;
}

export function useLessonPlayerChrome() {
  const ctx = useContext(LessonPlayerChromeContext);
  if (!ctx) {
    throw new Error("useLessonPlayerChrome must be used within LessonPlayerChromeProvider");
  }
  return ctx;
}
