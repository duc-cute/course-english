import api from "./axios";
import type { ApiResponse } from "./types";

export type QuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionSource = "MANUAL" | "IMPORT" | "AI" | "LESSON" | "EXAM";
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "MATCHING"
  | "FILL_BLANK"
  | "GAP_FILL_MCQ"
  | "READING_COMPREHENSION"
  | "TRUE_FALSE"
  | "LISTEN_CHOOSE"
  | "SPELLING"
  | "LISTEN_TYPE"
  | "REORDER_SENTENCE";

export type QuestionChoiceRecord = {
  id?: string;
  choiceKey: string;
  choiceText: string;
  correct: boolean;
  displayOrder?: number;
};

export type QuestionCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  displayOrder?: number;
};

export type QuestionRecord = {
  id: string;
  title?: string;
  categoryId?: string;
  categoryName?: string;
  questionType: QuestionType;
  status: QuestionStatus;
  promptText: string;
  promptLang?: string;
  explanation?: string;
  contentJson?: string;
  difficulty?: number;
  cefrLevel?: string;
  skill?: string;
  topic?: string;
  source?: QuestionSource;
  isAIGenerated?: boolean;
  tags?: string[];
  choices?: QuestionChoiceRecord[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QuestionStatsRecord = {
  total: number;
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
  aiGeneratedCount?: number;
};

export type QuestionsPaginationResult = {
  result?: QuestionRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export type BulkQuestionOperation = "PUBLISH" | "ARCHIVE" | "DRAFT" | "DELETE" | "DUPLICATE";

export type BulkQuestionResult = {
  requested: number;
  affected: number;
  notFoundIds?: string[];
  createdIds?: string[];
};

export type QuestionExportResult = {
  exportedAt?: string;
  requested: number;
  exported: number;
  notFoundIds?: string[];
  questions: QuestionRecord[];
};

export type QuestionFormPayload = {
  title?: string;
  categoryId?: string;
  questionType?: QuestionType;
  status?: QuestionStatus;
  promptText: string;
  promptLang?: string;
  explanation?: string;
  contentJson?: string;
  difficulty?: number;
  cefrLevel?: string;
  skill?: string;
  topic?: string;
  source?: QuestionSource;
  aiGenerated?: boolean;
  tags?: string[];
  choices?: Array<{
    choiceKey: string;
    choiceText: string;
    correct?: boolean;
    displayOrder?: number;
  }>;
};

function unwrapResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return response;
}

export async function apiSearchQuestions(payload?: Record<string, unknown>) {
  const response = (await api.post("/questions/search", payload ?? {})) as ApiResponse<QuestionsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetQuestionCategories() {
  const response = (await api.get("/questions/categories")) as ApiResponse<QuestionCategoryRecord[]>;
  return unwrapResponse(response);
}

export async function apiGetQuestionStats() {
  const response = (await api.get("/questions/stats")) as ApiResponse<QuestionStatsRecord>;
  return unwrapResponse(response);
}

export async function apiGetQuestionById(id: string) {
  const response = (await api.get(`/questions/${id}`)) as ApiResponse<QuestionRecord>;
  return unwrapResponse(response);
}

export async function apiCreateQuestion(data: QuestionFormPayload) {
  const response = (await api.post("/questions", data)) as ApiResponse<QuestionRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateQuestion(id: string, data: QuestionFormPayload) {
  const response = (await api.put(`/questions/${id}`, data)) as ApiResponse<QuestionRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteQuestion(id: string) {
  const response = (await api.delete(`/questions/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

function unwrapEntity<T>(response: ApiResponse<T>): T {
  const body = unwrapResponse(response) as ApiResponse<T> & { result?: T; data?: T };
  return (body.data ?? body.result ?? body) as T;
}

export async function apiBulkQuestions(payload: {
  ids: string[];
  operation: BulkQuestionOperation;
}): Promise<BulkQuestionResult> {
  const response = (await api.post("/questions/bulk", payload)) as ApiResponse<BulkQuestionResult>;
  return unwrapEntity(response);
}

export async function apiExportQuestions(ids: string[]): Promise<QuestionExportResult> {
  const response = (await api.post("/questions/export", { ids })) as ApiResponse<QuestionExportResult>;
  return unwrapEntity(response);
}
