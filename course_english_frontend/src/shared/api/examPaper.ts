import api from "./axios";
import type { ExamPaperOutline, ExamSectionGenSpec } from "./aiTask";
import type { ApiResponse } from "./types";
import type { QuestionType } from "./question";
import type { AiQuestionGenEnvelope } from "../ai/questionGen/types";

export type ExamPaperStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ExamSectionRecord = {
  id: string;
  examPaperId?: string;
  displayOrder: number;
  title?: string;
  instruction?: string;
  questionType?: QuestionType;
  payloadJson: string;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ExamPaperRecord = {
  id: string;
  title: string;
  instruction?: string;
  durationMinutes?: number;
  passScorePercent?: number;
  status: ExamPaperStatus;
  subjectId?: string;
  subjectName?: string;
  sectionCount?: number;
  questionCount?: number;
  bankQuestionsSynced?: number;
  sections?: ExamSectionRecord[];
  createdAt?: string;
  updatedAt?: string;
};

export type ExamPapersPaginationResult = {
  result?: ExamPaperRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export type ExamSectionFormPayload = {
  id?: string;
  title?: string;
  instruction?: string;
  questionType?: QuestionType;
  displayOrder?: number;
  payloadJson: string;
};

export type ExamPaperFormPayload = {
  title: string;
  instruction?: string;
  durationMinutes?: number;
  passScorePercent?: number;
  status?: ExamPaperStatus;
  subjectId?: string;
  sections?: ExamSectionFormPayload[];
};

export type ParseReadingBlockPayload = {
  rawText: string;
  expectedSubQuestionCounts?: number[];
};

export type GenerateReadingSectionPayload = {
  prompt: string;
  subQuestionCounts?: number[];
  difficulty?: number;
  promptLang?: string;
  grade?: number;
  languageLevel?: string;
  sectionInstruction?: string;
};

export type ParseReadingBlockResult = {
  envelope: AiQuestionGenEnvelope;
  warnings?: string[];
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

export async function apiSearchExamPapers(payload?: Record<string, unknown>) {
  const response = (await api.post("/exam-papers/search", payload ?? {})) as ApiResponse<ExamPapersPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetExamPaperById(id: string) {
  const response = (await api.get(`/exam-papers/${id}`)) as ApiResponse<ExamPaperRecord>;
  return unwrapResponse(response);
}

export async function apiCreateExamPaper(data: ExamPaperFormPayload) {
  const response = (await api.post("/exam-papers", data)) as ApiResponse<ExamPaperRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateExamPaper(id: string, data: ExamPaperFormPayload) {
  const response = (await api.put(`/exam-papers/${id}`, data)) as ApiResponse<ExamPaperRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteExamPaper(id: string) {
  const response = (await api.delete(`/exam-papers/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiReorderExamSections(examPaperId: string, sectionIds: string[]) {
  const response = (await api.patch(`/exam-papers/${examPaperId}/sections/reorder`, {
    sectionIds,
  })) as ApiResponse<ExamPaperRecord>;
  return unwrapResponse(response);
}

export async function apiExamPaperOutline(documentId: string): Promise<ExamPaperOutline> {
  const response = (await api.post("/exam-papers/ai/outline", { documentId })) as ApiResponse<ExamPaperOutline>;
  const body = unwrapResponse(response);
  return (body.data ?? body) as ExamPaperOutline;
}

export type ExamSectionSlicesResult = {
  sections: ExamSectionGenSpec[];
  warnings?: string[];
};

export async function apiExamSectionSlices(
  documentId: string,
  sections: ExamSectionGenSpec[],
): Promise<ExamSectionSlicesResult> {
  const response = (await api.post("/exam-papers/ai/section-slices", {
    documentId,
    sections,
  })) as ApiResponse<ExamSectionSlicesResult>;
  const body = unwrapResponse(response);
  return (body.data ?? body) as ExamSectionSlicesResult;
}

export async function apiParseReadingBlock(
  payload: ParseReadingBlockPayload,
): Promise<ParseReadingBlockResult> {
  const response = (await api.post("/exam-papers/ai/reading-parse", payload)) as ApiResponse<ParseReadingBlockResult>;
  const body = unwrapResponse(response);
  return (body.data ?? body) as ParseReadingBlockResult;
}

export async function apiGenerateReadingSection(
  payload: GenerateReadingSectionPayload,
): Promise<ParseReadingBlockResult> {
  const response = (await api.post("/exam-papers/ai/reading-generate", payload)) as ApiResponse<ParseReadingBlockResult>;
  const body = unwrapResponse(response);
  return (body.data ?? body) as ParseReadingBlockResult;
}

export type CreateSimilarExamPaperGenTaskPayload = {
  newExamTitle?: string;
  newPaperInstruction?: string;
  difficulty?: number;
  promptLang?: string;
};

export async function apiCreateSimilarExamPaperGenTask(
  sourceExamPaperId: string,
  payload: CreateSimilarExamPaperGenTaskPayload,
) {
  const response = (await api.post(
    `/exam-papers/${sourceExamPaperId}/ai/similar-generation`,
    payload,
  )) as ApiResponse<{ taskId: string; status: string }>;
  const body = unwrapResponse(response);
  return (body.data ?? body.result ?? body) as { taskId: string; status?: string };
}
