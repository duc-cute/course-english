import api from "./axios";
import type { ApiResponse } from "./types";

export type VocabularyWordRecord = {
  id?: string;
  wordKey?: string;
  wordEn: string;
  meaningVi?: string;
  phonetic?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  imageAssetId?: string;
  audioAssetId?: string;
  enrichedAt?: string;
  enrichSource?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VocabularyWordsPaginationResult = {
  result?: VocabularyWordRecord[];
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
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return response;
}

function unwrapData<T>(response: ApiResponse<T>): T | undefined {
  return (response?.result ?? response?.data) as T | undefined;
}

export async function apiSearchVocabularyWords(payload?: Record<string, unknown>) {
  const response = (await api.post("/vocabulary-words/search", payload ?? {})) as ApiResponse<VocabularyWordsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetVocabularyWordById(id: string) {
  const response = (await api.get(`/vocabulary-words/${id}`)) as ApiResponse<VocabularyWordRecord>;
  return unwrapResponse(response);
}

export async function apiCreateVocabularyWord(data: { wordEn: string; meaningVi: string }) {
  const response = (await api.post("/vocabulary-words", data)) as ApiResponse<VocabularyWordRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateVocabularyWord(id: string, data: { meaningVi: string }) {
  const response = (await api.put(`/vocabulary-words/${id}`, data)) as ApiResponse<VocabularyWordRecord>;
  return unwrapResponse(response);
}

export async function apiLookupVocabularyWord(wordEn: string): Promise<VocabularyWordRecord | null> {
  const trimmed = wordEn.trim();
  if (!trimmed) return null;
  try {
    const response = (await api.post("/vocabulary-words/lookup", { wordEn: trimmed })) as ApiResponse<VocabularyWordRecord>;
    if (!response || (typeof response === "object" && Object.keys(response).length === 0)) {
      return null;
    }
    return unwrapData(response) ?? null;
  } catch {
    return null;
  }
}

export async function apiEnrichVocabularyWord(id: string, force = false) {
  const response = (await api.post(`/vocabulary-words/${id}/enrich`, null, {
    params: { force },
  })) as ApiResponse<VocabularyWordRecord>;
  return unwrapResponse(response);
}
