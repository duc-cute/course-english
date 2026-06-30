import api from "./axios";
import type { ApiResponse } from "./types";

export type QuestionAiExplainResult = {
  questionId: string;
  explanation: string;
  previousExplanation?: string;
  explanationLang?: string;
  model?: string;
  durationMs?: number;
};

function unwrapEntity<T>(response: ApiResponse<T>): T {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  const body = response as ApiResponse<T> & { result?: T; data?: T };
  return (body.data ?? body.result ?? body) as T;
}

/** Sync AI: generate Vietnamese explanation for MCQ / TF / Fill (Phase 3c). */
export async function apiExplainQuestion(id: string): Promise<QuestionAiExplainResult> {
  const response = (await api.post(`/questions/${id}/ai/explain`)) as ApiResponse<QuestionAiExplainResult>;
  return unwrapEntity(response);
}
