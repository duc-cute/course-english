import api from "./axios";
import type { ApiResponse } from "./types";

export type LessonStatus = "DRAFT" | "PUBLISHED";

export type LessonBlockType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "CALLOUT"
  | "SUMMARY"
  | "QUESTION_REF"
  | "EXERCISE_SET";

export type LessonAssetType = "IMAGE" | "FILE" | "VIDEO" | "LINK";

export type LessonRecord = {
  id: string;
  title: string;
  summary?: string;
  status?: LessonStatus;
  displayOrder?: number;
  subjectId?: string;
  subjectName?: string;
  blockCount?: number;
};

export type LessonBlockRecord = {
  id: string;
  lessonId?: string;
  blockType: LessonBlockType;
  displayOrder: number;
  payloadJson?: string;
  /** QUESTION_REF — câu resolve từ bank (GET /lessons/{id}/detail) */
  resolvedQuestionsJson?: string;
};

export type LessonAssetRecord = {
  id: string;
  lessonId?: string;
  type: LessonAssetType;
  url: string;
  caption?: string;
  metaJson?: string;
  displayOrder?: number;
};

export type LessonDetailRecord = LessonRecord & {
  blocks?: LessonBlockRecord[];
  assets?: LessonAssetRecord[];
};

export type LessonsPaginationResult = {
  result?: LessonRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
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
  if (response?.success === false) {
    const error = new Error(response?.message || "API request failed") as Error & {
      response?: { data: ApiResponse<T> };
    };
    error.response = { data: response };
    throw error;
  }
  return response;
}

export async function apiGetLessons(payload?: Record<string, unknown>) {
  const response = (await api.post("/lessons/search", payload ?? {})) as ApiResponse<LessonsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetLessonById(id: string) {
  const response = (await api.get(`/lessons/${id}`)) as ApiResponse<LessonRecord>;
  return unwrapResponse(response);
}

export async function apiGetLessonDetail(id: string) {
  const response = (await api.get(`/lessons/${id}/detail`)) as ApiResponse<LessonDetailRecord>;
  return unwrapResponse(response);
}

export async function apiCreateLesson(data: {
  title: string;
  summary?: string;
  displayOrder?: number;
  subjectId: string;
}) {
  const response = (await api.post("/lessons", data)) as ApiResponse<LessonRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateLesson(
  id: string,
  data: {
    title: string;
    summary?: string;
    displayOrder?: number;
    subjectId: string;
    status?: LessonStatus;
  },
) {
  const response = (await api.put(`/lessons/${id}`, data)) as ApiResponse<LessonRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteLesson(id: string) {
  const response = (await api.delete(`/lessons/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiPublishLesson(id: string) {
  const response = (await api.post(`/lessons/${id}/publish`)) as ApiResponse<LessonRecord>;
  return unwrapResponse(response);
}

export async function apiUnpublishLesson(id: string) {
  const response = (await api.post(`/lessons/${id}/unpublish`)) as ApiResponse<LessonRecord>;
  return unwrapResponse(response);
}

export async function apiCreateLessonBlock(
  lessonId: string,
  data: {
    blockType: LessonBlockType;
    displayOrder?: number;
    payloadJson?: string;
  },
) {
  const response = (await api.post(`/lessons/${lessonId}/blocks`, data)) as ApiResponse<LessonBlockRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateLessonBlock(
  blockId: string,
  data: {
    blockType?: LessonBlockType;
    displayOrder?: number;
    payloadJson?: string;
  },
) {
  const response = (await api.put(`/lessons/lesson-blocks/${blockId}`, data)) as ApiResponse<LessonBlockRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteLessonBlock(blockId: string) {
  const response = (await api.delete(`/lessons/lesson-blocks/${blockId}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiReorderLessonBlocks(lessonId: string, blockIds: string[]) {
  const response = (await api.post(`/lessons/${lessonId}/blocks/reorder`, {
    blockIds,
  })) as ApiResponse<LessonBlockRecord[]>;
  return unwrapResponse(response);
}

export async function apiCreateLessonAsset(
  lessonId: string,
  data: {
    type: LessonAssetType;
    url: string;
    caption?: string;
    metaJson?: string;
    displayOrder?: number;
  },
) {
  const response = (await api.post(`/lessons/${lessonId}/assets`, data)) as ApiResponse<LessonAssetRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteLessonAsset(assetId: string) {
  const response = (await api.delete(`/lessons/lesson-assets/${assetId}`)) as ApiResponse;
  return unwrapResponse(response);
}

export function parseBlockPayload<T>(payloadJson?: string): T {
  if (!payloadJson || !payloadJson.trim()) return {} as T;
  try {
    return JSON.parse(payloadJson) as T;
  } catch {
    return {} as T;
  }
}

export function stringifyBlockPayload(payload: unknown): string {
  return JSON.stringify(payload ?? {});
}
