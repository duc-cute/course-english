import api from "./axios";
import type { LessonPlayerTab } from "../lesson/blockTypes";
import type { ApiResponse } from "./types";

export type LessonReadingProgressRecord = {
  id: string;
  userId: string;
  lessonId: string;
  lastBlockId?: string;
  scrollPercent: number;
  lastTab: LessonPlayerTab;
  lessonTitle?: string;
  subjectName?: string;
  lessonSlug?: string;
  coverImageUrl?: string;
  updatedAt?: string;
};

export type UpsertLessonReadingProgressPayload = {
  lastBlockId?: string;
  scrollPercent: number;
  lastTab: LessonPlayerTab;
  lessonTitle?: string;
  subjectName?: string;
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

export async function apiUpsertLessonReadingProgress(
  lessonId: string,
  payload: UpsertLessonReadingProgressPayload,
): Promise<LessonReadingProgressRecord> {
  const response = (await api.put(
    `/lesson-reading-progress/${lessonId}`,
    payload,
  )) as ApiResponse<LessonReadingProgressRecord>;
  return unwrapData(response);
}

export async function apiGetLessonReadingProgress(
  lessonId: string,
): Promise<LessonReadingProgressRecord | null> {
  try {
    const response = (await api.get(
      `/lesson-reading-progress/${lessonId}`,
    )) as ApiResponse<LessonReadingProgressRecord>;
    const data = unwrapData(response);
    return data?.lessonId ? data : null;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 204 || status === 404) return null;
    return null;
  }
}

export async function apiGetContinueReadingProgress(): Promise<LessonReadingProgressRecord | null> {
  try {
    const response = (await api.get(
      "/lesson-reading-progress/continue",
    )) as ApiResponse<LessonReadingProgressRecord>;
    const data = unwrapData(response);
    return data?.lessonId ? data : null;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 204 || status === 404) return null;
    return null;
  }
}
