import api from "./axios";
import type { ApiResponse } from "./types";

export type EnrollmentRecord = {
  id: string;
  classroomId?: string;
  classroomName?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  status?: "ACTIVE" | "INACTIVE";
  joinedAt?: string;
};

export type EnrollmentsPaginationResult = {
  result?: EnrollmentRecord[];
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

export async function apiGetEnrollments(payload?: Record<string, unknown>) {
  const response = (await api.post("/enrollments/search", payload ?? {})) as ApiResponse<EnrollmentsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiGetEnrollmentById(id: number | string) {
  const response = (await api.get(`/enrollments/${id}`)) as ApiResponse<EnrollmentRecord>;
  return unwrapResponse(response);
}

export async function apiCreateEnrollment(data: { classroomId: string; studentId: string; status?: string }) {
  const response = (await api.post("/enrollments", data)) as ApiResponse<EnrollmentRecord>;
  return unwrapResponse(response);
}

export async function apiUpdateEnrollment(
  id: number | string,
  data: { classroomId: string; studentId: string; status?: string },
) {
  const response = (await api.put(`/enrollments/${id}`, data)) as ApiResponse<EnrollmentRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteEnrollment(id: number | string) {
  const response = (await api.delete(`/enrollments/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}
