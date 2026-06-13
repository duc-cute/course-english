import { useCallback, useEffect, useState } from "react";
import { apiGetLessons, type LessonRecord, type LessonsPaginationResult } from "../../shared/api/lesson";
import {
  apiGetLatestLessonPracticeAttempt,
  apiGetLessonPracticeSummary,
  type LessonPracticeAttemptBrief,
  type LessonPracticeSummaryItem,
} from "../../shared/api/lessonPracticeAttempt";
import type { ApiResponse } from "../../shared/api/types";
import {
  getAllLessonProgress,
  type LessonProgressEntry,
} from "../lessonProgressStorage";
import { resolveContinueLearning } from "../lessonProgressSync";

export type UsePublishedLessonsOptions = {
  /** Lọc theo lớp đã ghi danh — null = tất cả lớp */
  classroomId?: string | null;
  /** Bật lọc enrollment (mặc định true cho khu vực học sinh) */
  enrolledOnly?: boolean;
};

export function usePublishedLessons(searchText: string, options: UsePublishedLessonsOptions = {}) {
  const { classroomId = null, enrolledOnly = true } = options;

  const [rows, setRows] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [practiceSummary, setPracticeSummary] = useState<Record<string, LessonPracticeSummaryItem>>({});
  const [continueProgress, setContinueProgress] = useState<LessonProgressEntry | null>(null);
  const [continuePractice, setContinuePractice] = useState<LessonPracticeAttemptBrief | null>(null);
  const [localProgress, setLocalProgress] = useState<Record<string, LessonProgressEntry>>({});

  useEffect(() => {
    setLocalProgress(getAllLessonProgress());
    void resolveContinueLearning().then(setContinueProgress);
  }, []);

  useEffect(() => {
    if (!continueProgress?.lessonId || continueProgress.lastTab !== "practice") {
      setContinuePractice(null);
      return;
    }
    void apiGetLatestLessonPracticeAttempt(continueProgress.lessonId).then(setContinuePractice);
  }, [continueProgress?.lessonId, continueProgress?.lastTab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page: 0,
        size: 50,
        sort: "displayOrder,asc",
        status: "PUBLISHED",
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (enrolledOnly) params.enrolledOnly = true;
      if (classroomId) params.classroomId = classroomId;

      const response = (await apiGetLessons(params)) as ApiResponse<LessonsPaginationResult>;
      const raw = response?.data?.result ?? response?.result;
      const items = Array.isArray(raw) ? raw : (raw as LessonsPaginationResult | undefined)?.result ?? [];
      setRows(items);

      const ids = items.map((l) => l.id).filter(Boolean);
      if (ids.length === 0) {
        setPracticeSummary({});
        return;
      }

      const summary = await apiGetLessonPracticeSummary(ids);
      const map: Record<string, LessonPracticeSummaryItem> = {};
      for (const row of summary) {
        map[row.lessonId] = row;
      }
      setPracticeSummary(map);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách bài học.");
      setRows([]);
      setPracticeSummary({});
    } finally {
      setLoading(false);
    }
  }, [searchText, classroomId, enrolledOnly]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    rows,
    loading,
    error,
    practiceSummary,
    continueProgress,
    continuePractice,
    localProgress,
    refetch: fetchData,
  };
}
