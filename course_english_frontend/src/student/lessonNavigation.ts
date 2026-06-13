import { apiGetLessons, type LessonDetailRecord, type LessonRecord, type LessonsPaginationResult } from "../shared/api/lesson";
import type { ApiResponse } from "../shared/api/types";

function unwrapLessonRows(response: ApiResponse<LessonsPaginationResult>): LessonRecord[] {
  const raw = response?.data?.result ?? response?.result;
  if (Array.isArray(raw)) return raw;
  return (raw as LessonsPaginationResult | undefined)?.result ?? [];
}

export async function findNextPublishedLesson(current: LessonDetailRecord): Promise<LessonRecord | null> {
  if (!current.subjectId) return null;

  const response = (await apiGetLessons({
    page: 0,
    size: 100,
    sort: "displayOrder,asc",
    status: "PUBLISHED",
    enrolledOnly: true,
    subjectId: current.subjectId,
  })) as ApiResponse<LessonsPaginationResult>;

  const rows = unwrapLessonRows(response).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const idx = rows.findIndex((l) => l.id === current.id);
  if (idx >= 0 && idx < rows.length - 1) return rows[idx + 1] ?? null;
  return null;
}
