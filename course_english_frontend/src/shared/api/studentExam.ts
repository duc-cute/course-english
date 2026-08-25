import api from "./axios";
import type { ApiResponse } from "./types";
import type { ExamSectionRecord } from "./examPaper";

export type ExamAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";

export type ExamAttemptRecord = {
  id: string;
  assignmentId?: string;
  examPaperId?: string;
  userId?: string;
  attemptNo?: number;
  status?: ExamAttemptStatus | string;
  startedAt?: string;
  submittedAt?: string | null;
  elapsedMs?: number;
  correctCount?: number | null;
  totalCount?: number | null;
  scorePercent?: number | null;
  passed?: boolean | null;
  passScorePercent?: number;
};

export type StudentExamAssignmentRecord = {
  id: string;
  examPaperId: string;
  examPaperTitle?: string;
  durationMinutes?: number | null;
  passScorePercent?: number;
  sectionCount?: number;
  questionCount?: number;
  classroomId?: string;
  classroomName?: string;
  assignedAt?: string;
  openAt?: string | null;
  dueAt?: string | null;
  closeAt?: string | null;
  maxAttempts?: number;
  note?: string;
  status?: string;
  windowOpen?: boolean;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  canStart?: boolean;
  inProgressAttempt?: ExamAttemptRecord | null;
  latestSubmittedAttempt?: ExamAttemptRecord | null;
  sections?: ExamSectionRecord[];
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

function unwrapData<T>(response: ApiResponse<T>): T {
  const unwrapped = unwrapResponse(response);
  return (unwrapped.result ?? unwrapped.data) as T;
}

export async function apiListStudentExams(classroomId?: string | null) {
  const params = classroomId ? { classroomId } : undefined;
  const response = (await api.get("/student/exams/assigned", {
    params,
  })) as ApiResponse<StudentExamAssignmentRecord[]>;
  return unwrapData(response) ?? [];
}

export async function apiGetStudentExam(assignmentId: string, includeSections = true) {
  const response = (await api.get(`/student/exams/assigned/${assignmentId}`, {
    params: { includeSections },
  })) as ApiResponse<StudentExamAssignmentRecord>;
  return unwrapData(response);
}

export async function apiStartExamAttempt(assignmentId: string) {
  const response = (await api.post("/student/exams/attempts/start", {
    assignmentId,
  })) as ApiResponse<ExamAttemptRecord>;
  return unwrapData(response);
}

export async function apiSubmitExamAttempt(payload: {
  attemptId: string;
  elapsedMs: number;
  answers?: Record<string, unknown>;
}) {
  const response = (await api.post(
    "/student/exams/attempts/submit",
    payload,
  )) as ApiResponse<ExamAttemptRecord>;
  return unwrapData(response);
}
