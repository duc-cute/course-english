import api from "./axios";
import type { ApiResponse } from "./types";

export type VocabularySetAssignmentRecord = {
  id: string;
  vocabularySetId: string;
  vocabularySetTitle?: string;
  coverImageUrl?: string;
  description?: string;
  itemCount?: number;
  classroomId?: string;
  classroomName?: string;
  assignedById?: string;
  teacherName?: string;
  assignedAt?: string;
  dueAt?: string | null;
  note?: string;
  status?: string;
};

export type VocabularySetAssignmentFormPayload = {
  vocabularySetId: string;
  classroomId: string;
  dueAt?: string | null;
  note?: string;
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

export async function apiCreateVocabularySetAssignment(data: VocabularySetAssignmentFormPayload) {
  const response = (await api.post(
    "/vocabulary-set-assignments",
    data,
  )) as ApiResponse<VocabularySetAssignmentRecord>;
  return unwrapResponse(response);
}

export async function apiSearchVocabularySetAssignments(payload?: Record<string, unknown>) {
  const response = (await api.post(
    "/vocabulary-set-assignments/search",
    payload ?? {},
  )) as ApiResponse<{ result?: VocabularySetAssignmentRecord[]; meta?: unknown }>;
  return unwrapResponse(response);
}

export async function apiCancelVocabularySetAssignment(id: string) {
  const response = (await api.delete(`/vocabulary-set-assignments/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiGetStudentAssignedVocabSets(classroomId?: string | null) {
  const params = classroomId ? { classroomId } : undefined;
  const response = (await api.get("/student/vocab/assigned", {
    params,
  })) as ApiResponse<VocabularySetAssignmentRecord[]>;
  return unwrapResponse(response);
}

export async function apiGetStudentAssignedVocabSet(assignmentId: string) {
  const response = (await api.get(
    `/student/vocab/assigned/${assignmentId}`,
  )) as ApiResponse<VocabularySetAssignmentRecord>;
  return unwrapResponse(response);
}
