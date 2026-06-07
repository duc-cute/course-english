import api from "./axios";
import type { ApiResponse } from "./types";

export type VocabularySetStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type VocabularyItemRecord = {
  id?: string;
  wordEn: string;
  meaningVi: string;
  phonetic?: string;
  imageAssetId?: string;
  audioAssetId?: string;
  displayOrder?: number;
};

export type VocabularySetRecord = {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  status: VocabularySetStatus;
  itemCount?: number;
  items?: VocabularyItemRecord[];
  createdAt?: string;
  updatedAt?: string;
};

export type VocabularySetsPaginationResult = {
  result?: VocabularySetRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export type VocabularySetFormPayload = {
  title: string;
  description?: string;
  subjectId?: string;
  status?: VocabularySetStatus;
  items: Array<{
    wordEn: string;
    meaningVi: string;
    phonetic?: string;
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

export async function apiSearchVocabularySets(payload?: Record<string, unknown>) {
  const response = (await api.post("/vocabulary-sets/search", payload ?? {})) as ApiResponse<VocabularySetsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetVocabularySetById(id: string) {
  const response = (await api.get(`/vocabulary-sets/${id}`)) as ApiResponse<VocabularySetRecord>;
  return unwrapResponse(response);
}

export async function apiCreateVocabularySet(data: VocabularySetFormPayload) {
  const response = (await api.post("/vocabulary-sets", data)) as ApiResponse<VocabularySetRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateVocabularySet(id: string, data: VocabularySetFormPayload) {
  const response = (await api.put(`/vocabulary-sets/${id}`, data)) as ApiResponse<VocabularySetRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteVocabularySet(id: string) {
  const response = (await api.delete(`/vocabulary-sets/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}
