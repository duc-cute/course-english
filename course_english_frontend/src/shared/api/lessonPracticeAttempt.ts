import api from "./axios";
import type { StructuredAttemptSnapshot } from "../lesson/attemptSnapshot";
import type { ApiResponse } from "./types";

export type LessonPracticeAttemptBrief = {
  id: string;
  lessonId: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  passScorePercent: number;
  completedAt?: string;
};

export type LessonPracticeSummaryItem = {
  lessonId: string;
  latest?: LessonPracticeAttemptBrief;
  best?: LessonPracticeAttemptBrief;
  attemptCount: number;
};

export type LessonPracticeAttemptRecord = LessonPracticeAttemptBrief & {
  userId: string;
  elapsedMs: number;
  blockIds?: string[];
  answersSnapshot?: StructuredAttemptSnapshot | Record<string, unknown>;
  createdAt?: string;
};

export type CreateLessonPracticeAttemptPayload = {
  lessonId: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  passScorePercent: number;
  elapsedMs: number;
  blockIds: string[];
  answersSnapshot: StructuredAttemptSnapshot;
};

function unwrapData<T>(response: ApiResponse<T>): T {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return response.data as T;
}

export function isPracticePassed(
  brief?: LessonPracticeAttemptBrief | null,
): boolean {
  if (!brief) return false;
  if (brief.passed) return true;
  return brief.scorePercent >= brief.passScorePercent;
}

export async function apiCreateLessonPracticeAttempt(
  payload: CreateLessonPracticeAttemptPayload,
): Promise<LessonPracticeAttemptRecord> {
  const response = (await api.post(
    "/lesson-practice-attempts",
    payload,
  )) as ApiResponse<LessonPracticeAttemptRecord>;
  return unwrapData(response);
}

export async function apiGetLessonPracticeSummary(
  lessonIds: string[],
): Promise<LessonPracticeSummaryItem[]> {
  if (lessonIds.length === 0) return [];
  try {
    const response = (await api.post("/lesson-practice-attempts/summary", {
      lessonIds,
    })) as ApiResponse<LessonPracticeSummaryItem[]>;
    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function apiGetLatestLessonPracticeAttempt(
  lessonId: string,
): Promise<LessonPracticeAttemptRecord | null> {
  try {
    const response = (await api.get(
      `/lesson-practice-attempts/lessons/${lessonId}/latest`,
    )) as ApiResponse<LessonPracticeAttemptRecord>;
    const data = unwrapData(response);
    return data?.id ? data : null;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 204 || status === 404) return null;
    return null;
  }
}

export async function apiListLessonPracticeAttempts(
  lessonId: string,
): Promise<LessonPracticeAttemptRecord[]> {
  const response = (await api.get(
    `/lesson-practice-attempts/lessons/${lessonId}`,
  )) as ApiResponse<LessonPracticeAttemptRecord[]>;
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
}
