import api from "./axios";
import type { ApiResponse } from "./types";

export type ActivityLogSeverity = "ERROR" | "WARN" | "INFO";
export type ActivityLogModule = "AI" | "API" | "SYSTEM";
export type ActivityLogAction =
  | "AI_GEN_TASK_CREATED"
  | "AI_GEN_START"
  | "AI_GEN_SKIP"
  | "AI_GEN_POLL_TIMEOUT"
  | "AI_GEN_PROMPT"
  | "AI_GEN_RESPONSE"
  | "AI_GEN_FAILED"
  | "AI_GEN_QUOTA"
  | "AI_DOC_READY"
  | "AI_DOC_FAIL"
  | "AI_OR_ROUND"
  | "AI_OR_ERROR"
  | "AI_OR_TIMEOUT"
  | "AI_JSON_INVALID"
  | "API_ERROR";

export type ActivityLogRecord = {
  id: string;
  severity?: ActivityLogSeverity;
  module?: ActivityLogModule;
  action?: ActivityLogAction;
  message?: string;
  detail?: string;
  contextJson?: string;
  refType?: string;
  refId?: string;
  httpMethod?: string;
  requestPath?: string;
  httpStatus?: number;
  userId?: string;
  occurredAt?: string;
  createdAt?: string;
};

export type ActivityLogsPaginationResult = {
  result?: ActivityLogRecord[];
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

export async function apiSearchActivityLogs(payload?: Record<string, unknown>) {
  const response = (await api.post("/activity-logs/search", payload ?? {})) as ApiResponse<ActivityLogsPaginationResult>;
  return unwrapResponse(response);
}
