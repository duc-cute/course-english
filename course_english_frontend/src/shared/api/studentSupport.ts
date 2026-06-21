import api from "./axios";
import type { ApiResponse } from "./types";

export type StudentSupportRiskLevel = "CRITICAL" | "WARNING" | "ATTENTION";

export type StudentSupportOverdueLesson = {
  lessonId: string;
  title: string;
  dueAt?: string;
};

export type StudentSupportLessonProgress = {
  lessonId: string;
  title: string;
  slug?: string;
  dueAt?: string | null;
  bestScorePercent?: number | null;
  passed?: boolean;
  completedAt?: string | null;
};

export type StudentSupportDetail = {
  profile: StudentSupportItem;
  overdueLessons: StudentSupportLessonProgress[];
  upcomingLessons: StudentSupportLessonProgress[];
  completedLessons: StudentSupportLessonProgress[];
};

export type StudentSupportItem = {
  studentId: string;
  studentName: string;
  avatarUrl?: string | null;
  classroomId: string;
  classroomName: string;
  riskLevel: StudentSupportRiskLevel;
  riskScore: number;
  inactiveDays: number;
  missingAssignments: number;
  overdueLessons?: StudentSupportOverdueLesson[];
  avgScorePercent?: number | null;
  scoreTrendPercent?: number | null;
  primaryReason: string;
  reasonCodes?: string[];
};

export type StudentSupportSummary = {
  criticalCount: number;
  warningCount: number;
  attentionCount: number;
  totalAtRisk: number;
};

export type StudentSupportListResult = {
  summary: StudentSupportSummary;
  items: StudentSupportItem[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

function extractData<T>(response: ApiResponse<T>): T {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return (response.data ?? response) as T;
}

export async function apiGetStudentSupportSummary(classroomId?: string) {
  const response = (await api.get("/teacher/students-need-support/summary", {
    params: classroomId ? { classroomId } : undefined,
  })) as ApiResponse<StudentSupportSummary>;
  return extractData(response);
}

export async function apiGetStudentSupportWidget(classroomId?: string) {
  const response = (await api.get("/teacher/students-need-support/widget", {
    params: classroomId ? { classroomId } : undefined,
  })) as ApiResponse<StudentSupportItem[]>;
  return extractData(response);
}

export async function apiSearchStudentsNeedSupport(params?: {
  classroomId?: string;
  riskLevel?: StudentSupportRiskLevel;
  minInactiveDays?: number;
  minMissing?: number;
  keyword?: string;
  page?: number;
  size?: number;
}) {
  const response = (await api.get("/teacher/students-need-support", {
    params,
  })) as ApiResponse<StudentSupportListResult>;
  return extractData(response);
}

export async function apiGetStudentSupportDetail(studentId: string, classroomId: string) {
  const response = (await api.get(`/teacher/students-need-support/${studentId}/detail`, {
    params: { classroomId },
  })) as ApiResponse<StudentSupportDetail>;
  return extractData(response);
}
