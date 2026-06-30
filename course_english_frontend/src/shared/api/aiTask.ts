import api from "./axios";
import type { ApiResponse } from "./types";
import type { AiGenQuestionType, AiDraftQuestion, AiQuestionGenEnvelope } from "../ai/questionGen/types";

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
  outputJson?: AiQuestionGenEnvelope | AiExamPaperGenEnvelope | AiVocabularySetGenEnvelope | null;
  errorMessage?: string;
  model?: string;
  progressMessage?: string | null;
  progressPercent?: number | null;
};

export type CreateQuestionGenTaskPayload = {
  documentId?: string;
  questionCount?: number;
  questionTypes?: AiGenQuestionType[];
  typeQuotas?: Partial<Record<AiGenQuestionType, number>>;
  topic?: string;
  grade?: number;
  languageLevel?: string;
  additionalInstructions?: string;
  readingSubQuestionCount?: number;
  difficulty?: number;
  promptLang?: string;
  customUserPromptByType?: Partial<Record<AiGenQuestionType, string>>;
  /** AI-3: generate from saved vocabulary set */
  vocabularySetId?: string;
};

export type ExamSectionSliceMode = "SLICED" | "FULL";
export type ExamSectionSliceConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ExamSectionGenSpec = {
  title?: string;
  instruction?: string;
  questionType: AiGenQuestionType;
  questionCount: number;
  excerptStart?: number;
  excerptEnd?: number;
  sliceMode?: ExamSectionSliceMode;
  sliceConfidence?: ExamSectionSliceConfidence;
  sliceMarkerLabel?: string;
  excerptPreview?: string;
  useFullDocument?: boolean;
};

export type ExamPaperOutline = {
  examTitle?: string;
  paperInstruction?: string;
  sections: ExamSectionGenSpec[];
  warnings?: string[];
};

export type AiExamPaperGenSection = {
  title?: string;
  instruction?: string;
  questionType?: AiGenQuestionType;
  questions: AiDraftQuestion[];
};

export type AiExamPaperGenEnvelope = {
  schemaVersion?: number;
  examTitle?: string;
  paperInstruction?: string;
  sections: AiExamPaperGenSection[];
  meta?: { summaryMessage?: string; model?: string };
};

export type CreateExamPaperGenTaskPayload = {
  documentId: string;
  sectionSpecs: ExamSectionGenSpec[];
  examTitle?: string;
  paperInstruction?: string;
  readingSubQuestionCount?: number;
  difficulty?: number;
  promptLang?: string;
};

export type AiVocabularySetGenItem = {
  wordEn: string;
  meaningVi: string;
  partOfSpeech?: string;
  exampleSentence?: string;
};

export type AiVocabularySetGenEnvelope = {
  schemaVersion?: number;
  title: string;
  description?: string;
  coverImagePrompt?: string;
  coverImageUrl?: string;
  items: AiVocabularySetGenItem[];
  meta?: { model?: string; summaryMessage?: string; itemCount?: number };
};

export type CreateVocabularySetGenTaskPayload = {
  topicPrompt: string;
  languageLevel?: string;
  wordCount: number;
  titleHint?: string;
  additionalInstructions?: string;
  generateCover?: boolean;
};

export type PromptBatchPreview = {
  questionType: AiGenQuestionType;
  count: number;
  systemPrompt: string;
  userPrompt: string;
};

export type AiQuestionGenPromptPreview = {
  sourceExcerpt: string;
  topicMode: boolean;
  totalQuestionCount: number;
  batches: PromptBatchPreview[];
};

export type AiTaskHistoryItem = {
  id: string;
  status: AiTaskStatus;
  taskType?: string;
  createdAt?: string;
  topic?: string;
  questionCount?: number;
  validCount?: number;
  summaryMessage?: string;
  label?: string;
};

export type AiTaskHistoryPage = {
  meta: { page: number; pageSize: number; pages: number; total: number };
  result: AiTaskHistoryItem[];
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

export async function apiPreviewQuestionGenPrompt(
  payload: CreateQuestionGenTaskPayload,
): Promise<AiQuestionGenPromptPreview> {
  const response = (await api.post("/ai/tasks/question-generation/prompt-preview", payload)) as ApiResponse<
    AiQuestionGenPromptPreview
  >;
  return unwrapEntity(response);
}

export async function apiListAiTaskHistory(page = 0, pageSize = 15): Promise<AiTaskHistoryPage> {
  const response = (await api.get("/ai/tasks/history", { params: { page, pageSize } })) as ApiResponse<
    AiTaskHistoryPage
  >;
  const body = unwrapResponse(response) as ApiResponse<AiTaskHistoryPage> & {
    result?: AiTaskHistoryItem[];
    meta?: AiTaskHistoryPage["meta"];
    data?: AiTaskHistoryPage;
  };
  if (body.data?.result) return body.data;
  if (Array.isArray(body.result)) {
    return {
      result: body.result,
      meta: body.meta ?? { page, pageSize, pages: 1, total: body.result.length },
    };
  }
  return unwrapEntity(response);
}

export async function apiCreateQuestionGenTask(payload: CreateQuestionGenTaskPayload) {
  const response = (await api.post("/ai/tasks/question-generation", payload)) as ApiResponse<{
    taskId: string;
    status: AiTaskStatus;
  }>;
  return unwrapEntity(response);
}

export async function apiCreateExamPaperGenTask(payload: CreateExamPaperGenTaskPayload) {
  const response = (await api.post("/ai/tasks/exam-paper-generation", payload)) as ApiResponse<{
    taskId: string;
    status: AiTaskStatus;
  }>;
  return unwrapEntity(response);
}

export async function apiCreateVocabularySetGenTask(payload: CreateVocabularySetGenTaskPayload) {
  const response = (await api.post("/ai/tasks/vocabulary-set-generation", payload)) as ApiResponse<{
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

export async function apiPatchAiTaskDraft(
  taskId: string,
  payload: { questions: AiDraftQuestion[] },
): Promise<AiTaskRecord> {
  const response = (await api.patch(`/ai/tasks/${taskId}/draft`, payload)) as ApiResponse<AiTaskRecord>;
  return unwrapEntity(response);
}
