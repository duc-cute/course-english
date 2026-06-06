import api from "./axios";
import type { ApiResponse } from "./types";

export type SubjectRecord = {
  id: string;
  name: string;
  displayOrder?: number;
  classroomId?: string;
  classroomName?: string;
};

export type SubjectsPaginationResult = {
  result?: SubjectRecord[];
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

export async function apiGetSubjects(payload?: Record<string, unknown>) {
  const response = (await api.post("/subjects/search", payload ?? {})) as ApiResponse<SubjectsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetSubjectById(id: number | string) {
  const response = (await api.get(`/subjects/${id}`)) as ApiResponse<SubjectRecord>;
  return unwrapResponse(response);
}

export async function apiCreateSubject(data: {
  name: string;
  displayOrder?: number;
  classroomId: string;
}) {
  const response = (await api.post("/subjects", data)) as ApiResponse<SubjectRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateSubject(
  id: number | string,
  data: { name: string; displayOrder?: number; classroomId: string },
) {
  const response = (await api.put(`/subjects/${id}`, data)) as ApiResponse<SubjectRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteSubject(id: number | string) {
  const response = (await api.delete(`/subjects/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}
