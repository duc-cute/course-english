import { useEffect, useState } from "react";
import {
  apiListLessonPracticeAttempts,
  isPracticePassed,
  type LessonPracticeAttemptRecord,
  type LessonPracticeSummaryItem,
} from "../../shared/api/lessonPracticeAttempt";
import type { LessonRecord } from "../../shared/api/lesson";

export type PracticeHistoryRow = LessonPracticeAttemptRecord & {
  lessonTitle: string;
};

export function usePracticeHistory(
  lessons: LessonRecord[],
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
  lessonTitleById: Record<string, string>,
  enabled: boolean,
) {
  const [rows, setRows] = useState<PracticeHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    const lessonIds = lessons
      .map((lesson) => lesson.id)
      .filter((id) => (practiceSummary[id]?.attemptCount ?? 0) > 0);

    if (lessonIds.length === 0) {
      setRows([]);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    void Promise.all(lessonIds.map((id) => apiListLessonPracticeAttempts(id)))
      .then((results) => {
        if (cancelled) return;

        const flat: PracticeHistoryRow[] = results.flat().map((attempt) => ({
          ...attempt,
          lessonTitle: lessonTitleById[attempt.lessonId] ?? "Bài học",
        }));

        flat.sort(
          (a, b) =>
            new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime(),
        );

        setRows(flat.slice(0, 15));
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setError((err as { message?: string })?.message || "Không thể tải lịch sử làm bài.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, lessons, practiceSummary, lessonTitleById]);

  return { rows, loading, error };
}

export function formatAttemptResult(attempt: PracticeHistoryRow): string {
  const passed = isPracticePassed(attempt);
  return passed ? "Đạt" : `${attempt.scorePercent}%`;
}
