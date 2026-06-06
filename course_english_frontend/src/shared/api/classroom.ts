import api from "./axios";
import type { ApiResponse } from "./types";

export type ClassroomRecord = {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
};

export type ClassroomsPaginationResult = {
  result?: ClassroomRecord[];
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

export async function apiGetClassrooms(payload?: Record<string, unknown>) {
  const response = (await api.post("/classrooms/search", payload ?? {})) as ApiResponse<ClassroomsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetClassroomById(id: number | string) {
  const response = (await api.get(`/classrooms/${id}`)) as ApiResponse<ClassroomRecord>;
  return unwrapResponse(response);
}

export async function apiCreateClassroom(data: {
  name: string;
  code: string;
  description?: string;
  teacherId?: string;
}) {
  const response = (await api.post("/classrooms", data)) as ApiResponse<ClassroomRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateClassroom(
  id: number | string,
  data: { name: string; code: string; description?: string; teacherId?: string },
) {
  const response = (await api.put(`/classrooms/${id}`, data)) as ApiResponse<ClassroomRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteClassroom(id: number | string) {
  const response = (await api.delete(`/classrooms/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}
