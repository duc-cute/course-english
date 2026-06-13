import { useEffect, useMemo, useState } from "react";
import { apiGetLatestLessonPracticeAttempt, type LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { resolveContinueLearning } from "../lessonProgressSync";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { countWeeklyActiveDays, getWeeklyStudyDays, type WeeklyStudyDay } from "./getWeeklyStudyDays";

export type HomeDashboardState = {
  continueProgress: LessonProgressEntry | null;
  continuePractice: LessonPracticeAttemptBrief | null;
  weeklyDays: WeeklyStudyDay[];
  weeklyStreakCount: number;
  loading: boolean;
};

export function useHomeDashboard(): HomeDashboardState {
  const [continueProgress, setContinueProgress] = useState<LessonProgressEntry | null>(null);
  const [continuePractice, setContinuePractice] = useState<LessonPracticeAttemptBrief | null>(null);
  const [loading, setLoading] = useState(true);

  const weeklyDays = useMemo(() => getWeeklyStudyDays(), []);
  const weeklyStreakCount = useMemo(() => countWeeklyActiveDays(weeklyDays), [weeklyDays]);

  useEffect(() => {
    let cancelled = false;
    void resolveContinueLearning()
      .then((entry) => {
        if (!cancelled) setContinueProgress(entry);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!continueProgress?.lessonId || continueProgress.lastTab !== "practice") {
      setContinuePractice(null);
      return;
    }
    void apiGetLatestLessonPracticeAttempt(continueProgress.lessonId).then(setContinuePractice);
  }, [continueProgress?.lessonId, continueProgress?.lastTab]);

  return {
    continueProgress,
    continuePractice,
    weeklyDays,
    weeklyStreakCount,
    loading,
  };
}
