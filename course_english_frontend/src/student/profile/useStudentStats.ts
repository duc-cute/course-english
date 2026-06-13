import { useEffect, useMemo, useState } from "react";
import { apiGetLessons, type LessonRecord, type LessonsPaginationResult } from "../../shared/api/lesson";
import {
  apiGetLessonPracticeSummary,
  type LessonPracticeSummaryItem,
} from "../../shared/api/lessonPracticeAttempt";
import type { ApiResponse } from "../../shared/api/types";
import { getWeeklyStudyDays } from "../home/getWeeklyStudyDays";
import { getAllLessonProgress, type LessonProgressEntry } from "../lessonProgressStorage";
import { computeStudentStats, type StudentStats } from "./studentStats";

export function useStudentStats() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [practiceSummary, setPracticeSummary] = useState<Record<string, LessonPracticeSummaryItem>>({});
  const [localProgress] = useState<Record<string, LessonProgressEntry>>(() => getAllLessonProgress());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weeklyDays = useMemo(() => getWeeklyStudyDays(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = (await apiGetLessons({
          page: 0,
          size: 100,
          sort: "displayOrder,asc",
          status: "PUBLISHED",
          enrolledOnly: true,
        })) as ApiResponse<LessonsPaginationResult>;

        const raw = response?.data?.result ?? response?.result;
        const items = Array.isArray(raw) ? raw : (raw as LessonsPaginationResult | undefined)?.result ?? [];
        if (cancelled) return;
        setLessons(items);

        const ids = items.map((lesson) => lesson.id).filter(Boolean);
        if (ids.length === 0) {
          setPracticeSummary({});
          return;
        }

        const summary = await apiGetLessonPracticeSummary(ids);
        if (cancelled) return;

        const map: Record<string, LessonPracticeSummaryItem> = {};
        for (const row of summary) {
          map[row.lessonId] = row;
        }
        setPracticeSummary(map);
      } catch (err) {
        if (!cancelled) {
          setLessons([]);
          setPracticeSummary({});
          setError((err as { message?: string })?.message || "Không thể tải thống kê học tập.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: StudentStats = useMemo(
    () => computeStudentStats(lessons, localProgress, practiceSummary, weeklyDays),
    [lessons, localProgress, practiceSummary, weeklyDays],
  );

  const lessonTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lesson of lessons) {
      map[lesson.id] = lesson.title?.trim() || "Bài học";
    }
    return map;
  }, [lessons]);

  return {
    stats,
    lessons,
    practiceSummary,
    lessonTitleById,
    loading,
    error,
  };
}
