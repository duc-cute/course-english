import api from "./axios";
import type { ApiResponse } from "./types";

export type ExamAssignmentStatus = "ACTIVE" | "CANCELLED";

export type ExamAssignmentRecord = {
  id: string;
  examPaperId: string;
  examPaperTitle?: string;
  durationMinutes?: number;
  passScorePercent?: number;
  sectionCount?: number;
  questionCount?: number;
  classroomId?: string;
  classroomName?: string;
  assignedById?: string;
  teacherName?: string;
  assignedAt?: string;
  openAt?: string | null;
  dueAt?: string | null;
  closeAt?: string | null;
  maxAttempts?: number;
  note?: string;
  status?: ExamAssignmentStatus | string;
};

export type ExamAssignmentFormPayload = {
  examPaperId: string;
  classroomId: string;
  openAt?: string | null;
  dueAt?: string | null;
  closeAt?: string | null;
  maxAttempts?: number;
  note?: string;
};

export type ExamClassScoreRecord = {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  attemptStatus?: string;
  attemptNo?: number;
  scorePercent?: number | null;
  passed?: boolean | null;
  submittedAt?: string | null;
  latestStatus?: string | null;
};

export type ExamAssignmentsPaginationResult = {
  result?: ExamAssignmentRecord[];
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

export async function apiCreateExamAssignment(data: ExamAssignmentFormPayload) {
  const response = (await api.post(
    "/exam-assignments",
    data,
  )) as ApiResponse<ExamAssignmentRecord>;
  return unwrapResponse(response);
}

export async function apiSearchExamAssignments(payload?: Record<string, unknown>) {
  const response = (await api.post(
    "/exam-assignments/search",
    payload ?? {},
  )) as ApiResponse<ExamAssignmentsPaginationResult>;
  return unwrapResponse(response);
}

export async function apiCancelExamAssignment(id: string) {
  const response = (await api.delete(`/exam-assignments/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}

export async function apiGetExamAssignmentScores(assignmentId: string) {
  const response = (await api.get(
    `/exam-assignments/${assignmentId}/scores`,
  )) as ApiResponse<ExamClassScoreRecord[]>;
  return unwrapResponse(response);
}
