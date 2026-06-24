import api from "./axios";
import type { ApiResponse } from "./types";
import type { AiGenQuestionType, AiQuestionGenEnvelope } from "../ai/questionGen/types";

export type AiDocumentStatus = "UPLOADED" | "EXTRACTING" | "READY" | "FAILED";

export type AiDocumentRecord = {
  id: string;
  fileName: string;
  mimeType?: string;
  status: AiDocumentStatus;
  pageCount?: number;
  errorMessage?: string;
};

export type AiTaskStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export type AiTaskRecord = {
  id: string;
  status: AiTaskStatus;
  taskType?: string;
  outputJson?: AiQuestionGenEnvelope | null;
  errorMessage?: string;
  model?: string;
};

export type CreateQuestionGenTaskPayload = {
  documentId: string;
  questionCount: number;
  questionTypes: AiGenQuestionType[];
  difficulty?: number;
  promptLang?: string;
};

function unwrapResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    const error = new Error(response?.message || "API request failed") as Error & {
      response?: { data: ApiResponse<T> };
    };
    error.response = { data: response };
    throw error;
  }
  return response;
}

function unwrapEntity<T>(response: ApiResponse<T>): T {
  const body = unwrapResponse(response) as ApiResponse<T> & { result?: T };
  return (body.data ?? body.result ?? body) as T;
}

export async function apiCreateTextAiDocument(payload: {
  text: string;
  title?: string;
}): Promise<AiDocumentRecord> {
  const response = (await api.post("/ai/documents/text", payload)) as ApiResponse<AiDocumentRecord>;
  return unwrapEntity(response);
}

export async function apiUploadAiDocument(file: File): Promise<AiDocumentRecord> {
  const formData = new FormData();
  formData.append("file", file);
  const response = (await api.post("/ai/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as ApiResponse<AiDocumentRecord>;
  return unwrapEntity(response);
}

export async function apiCreateQuestionGenTask(payload: CreateQuestionGenTaskPayload) {
  const response = (await api.post("/ai/tasks/question-generation", payload)) as ApiResponse<{
    taskId: string;
    status: AiTaskStatus;
  }>;
  return unwrapEntity(response);
}

export async function apiGetAiTask(taskId: string): Promise<AiTaskRecord> {
  const response = (await api.get(`/ai/tasks/${taskId}`)) as ApiResponse<AiTaskRecord>;
  return unwrapEntity(response);
}

export async function apiReportAiTaskPollTimeout(taskId: string): Promise<void> {
  await api.post(`/ai/tasks/${taskId}/client-poll-timeout`);
}
