import api from "./axios";
import type { ApiResponse } from "./types";

export type SystemConfigRecord = {
  id: string;
  configKey: string;
  configValue?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemConfigsPaginationResult = {
  result?: SystemConfigRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

import type { VocabularyAudioAccent } from "../constants/systemConfigKeys";

export type FeatureFlags = {
  dictionaryEnrichEnabled: boolean;
  vocabularyAudioEnabled: boolean;
  vocabularyAudioAccent: VocabularyAudioAccent;
  studentSelfRegistrationEnabled: boolean;
  vocabularyPracticeMaxQuestions: number;
  vocabularyPracticePassScore: number;
  brandName?: string;
  wordExportLogoUrl?: string;
  wordExportWatermarkText?: string;
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

export async function apiGetFeatureFlags() {
  const response = (await api.get("/system-configs/feature-flags")) as ApiResponse<FeatureFlags>;
  return unwrapResponse(response);
}

export async function apiSearchSystemConfigs(payload?: Record<string, unknown>) {
  const response = (await api.post("/system-configs/search", payload ?? {})) as ApiResponse<SystemConfigsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetSystemConfigById(id: string) {
  const response = (await api.get(`/system-configs/${id}`)) as ApiResponse<SystemConfigRecord>;
  return unwrapResponse(response);
}

export async function apiCreateSystemConfig(data: {
  configKey: string;
  configValue?: string;
  note?: string;
}) {
  const response = (await api.post("/system-configs", data)) as ApiResponse<SystemConfigRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateSystemConfig(
  id: string,
  data: { configKey: string; configValue?: string; note?: string },
) {
  const response = (await api.put(`/system-configs/${id}`, data)) as ApiResponse<SystemConfigRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteSystemConfig(id: string) {
  const response = (await api.delete(`/system-configs/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiCheckSystemConfigKey(configKey: string, id?: string) {
  const response = (await api.post("/system-configs/check-key", { configKey, id })) as ApiResponse<{
    exists: boolean;
  }>;
  return unwrapResponse(response);
}
