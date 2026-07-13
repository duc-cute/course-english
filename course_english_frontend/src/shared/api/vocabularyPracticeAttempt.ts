import api from "./axios";
import type { StructuredAttemptSnapshot } from "../lesson/attemptSnapshot";
import type { ApiResponse } from "./types";

export type VocabularyPracticeAttemptBrief = {
  id: string;
  vocabularySetId: string;
  assignmentId?: string | null;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  passScorePercent: number;
  completedAt?: string;
};

export type VocabularyPracticeSummaryItem = {
  vocabularySetId: string;
  latest?: VocabularyPracticeAttemptBrief;
  best?: VocabularyPracticeAttemptBrief;
  attemptCount: number;
};

export type VocabularyPracticeAttemptRecord = VocabularyPracticeAttemptBrief & {
  userId: string;
  elapsedMs: number;
  blockIds?: string[];
  answersSnapshot?: StructuredAttemptSnapshot | Record<string, unknown>;
  createdAt?: string;
};

export type CreateVocabularyPracticeAttemptPayload = {
  vocabularySetId: string;
  assignmentId?: string | null;
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

export function isVocabPracticePassed(
  brief?: VocabularyPracticeAttemptBrief | null,
): boolean {
  if (!brief) return false;
  if (brief.passed) return true;
  return brief.scorePercent >= brief.passScorePercent;
}

export async function apiCreateVocabularyPracticeAttempt(
  payload: CreateVocabularyPracticeAttemptPayload,
): Promise<VocabularyPracticeAttemptRecord> {
  const response = (await api.post(
    "/student/vocab/practice-attempts",
    payload,
  )) as ApiResponse<VocabularyPracticeAttemptRecord>;
  return unwrapData(response);
}

export async function apiGetVocabularyPracticeSummary(
  vocabularySetIds: string[],
): Promise<VocabularyPracticeSummaryItem[]> {
  if (vocabularySetIds.length === 0) return [];
  try {
    const response = (await api.post("/student/vocab/practice-attempts/summary", {
      vocabularySetIds,
    })) as ApiResponse<VocabularyPracticeSummaryItem[]>;
    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function apiGetLatestVocabularyPracticeAttempt(
  vocabularySetId: string,
): Promise<VocabularyPracticeAttemptRecord | null> {
  try {
    const response = (await api.get("/student/vocab/practice-attempts/latest", {
      params: { vocabularySetId },
    })) as ApiResponse<VocabularyPracticeAttemptRecord>;
    const data = unwrapData(response);
    return data?.id ? data : null;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 204 || status === 404) return null;
    return null;
  }
}
