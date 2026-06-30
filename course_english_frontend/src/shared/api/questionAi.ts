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

export type QuestionBankAiAction = "SIMILAR" | "REWRITE" | "SIMPLIFY" | "INCREASE_DIFFICULTY";

export type QuestionBankAiTaskResult = {
  taskId: string;
  status?: string;
  sourceQuestionId: string;
  targetQuestionId?: string;
  action: QuestionBankAiAction;
};

export type BulkQuestionBankAiResult = {
  requested: number;
  taskIds: string[];
  errors: { questionId: string; message: string }[];
};

export async function apiQuestionBankSimilar(
  id: string,
  body?: { questionCount?: number; additionalInstructions?: string },
): Promise<QuestionBankAiTaskResult> {
  const response = (await api.post(`/questions/${id}/ai/similar`, body ?? {})) as ApiResponse<QuestionBankAiTaskResult>;
  return unwrapEntity(response);
}

export async function apiQuestionBankRewrite(
  id: string,
  body: { mode: Exclude<QuestionBankAiAction, "SIMILAR"> },
): Promise<QuestionBankAiTaskResult> {
  const response = (await api.post(`/questions/${id}/ai/rewrite`, body)) as ApiResponse<QuestionBankAiTaskResult>;
  return unwrapEntity(response);
}

export async function apiBulkQuestionBankAi(body: {
  ids: string[];
  action: QuestionBankAiAction;
  questionCount?: number;
}): Promise<BulkQuestionBankAiResult> {
  const response = (await api.post("/questions/bulk-ai", body)) as ApiResponse<BulkQuestionBankAiResult>;
  return unwrapEntity(response);
}
