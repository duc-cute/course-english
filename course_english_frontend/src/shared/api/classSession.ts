import api from "./axios";
import type { ApiResponse } from "./types";

export type SessionType = "LIVE_CLASS" | "OFFICE_HOURS" | "EXAM" | "OTHER";
export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type SessionUiState = "LIVE" | "UPCOMING" | "PAST" | "NEEDS_SETUP";
export type RecurrenceScope = "THIS_ONLY" | "THIS_AND_FOLLOWING" | "ALL_IN_SERIES";

export type ClassSessionRecord = {
  id: string;
  classroomId?: string;
  classroomName?: string;
  classroomCode?: string;
  teacherId?: string;
  title: string;
  sessionType: SessionType;
  startAt: string;
  endAt: string;
  meetLink?: string | null;
  locationLabel?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  activeStudentCount?: number;
  status: SessionStatus;
  uiState: SessionUiState;
  canJoinMeet: boolean;
  canOpenLesson: boolean;
  needsSetup: boolean;
  notes?: string | null;
  recurrenceGroupId?: string | null;
  recurrenceRule?: string | null;
  recurring?: boolean;
};

export type TeachingPlanSummary = {
  classesToday: number;
  sessionsToday: number;
  nextSessionInMinutes?: number | null;
  nextSessionTitle?: string | null;
};

export type TeachingPlanDTO = {
  date: string;
  timezone?: string;
  summary: TeachingPlanSummary;
  sessions: ClassSessionRecord[];
};

export type ClassSessionPayload = {
  classroomId: string;
  lessonId?: string | null;
  title: string;
  sessionType: SessionType;
  startAt: string;
  endAt: string;
  meetLink?: string | null;
  locationLabel?: string | null;
  notes?: string | null;
};

export type RecurringClassSessionPayload = {
  classroomId: string;
  lessonId?: string | null;
  title: string;
  sessionType: SessionType;
  weekdays: number[];
  rangeStart: string;
  rangeEnd?: string | null;
  weekCount?: number | null;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  locationLabel?: string | null;
  notes?: string | null;
};

export type RecurringCreateResult = {
  recurrenceGroupId: string;
  recurrenceRule?: string;
  createdCount: number;
  sessions?: ClassSessionRecord[];
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

function extractData<T>(response: ApiResponse<T>): T {
  const unwrapped = unwrapResponse(response);
  return (unwrapped.data ?? unwrapped) as T;
}

export async function apiGetTeachingPlanToday() {
  const response = (await api.get("/teacher/teaching-plan/today")) as ApiResponse<TeachingPlanDTO>;
  return extractData(response);
}

export async function apiGetTeachingPlanByDate(date: string) {
  const response = (await api.get("/teacher/teaching-plan", { params: { date } })) as ApiResponse<TeachingPlanDTO>;
  return extractData(response);
}

export async function apiGetTeachingPlanRange(from: string, to: string) {
  const response = (await api.get("/teacher/teaching-plan/range", { params: { from, to } })) as ApiResponse<TeachingPlanDTO>;
  return extractData(response);
}

export async function apiGetClassSessionById(id: string) {
  const response = (await api.get(`/class-sessions/${id}`)) as ApiResponse<ClassSessionRecord>;
  return extractData(response);
}

export async function apiCreateClassSession(payload: ClassSessionPayload) {
  const response = (await api.post("/class-sessions", payload)) as ApiResponse<ClassSessionRecord>;
  return extractData(response);
}

export async function apiCreateRecurringClassSessions(payload: RecurringClassSessionPayload) {
  const response = (await api.post("/class-sessions/recurring", payload)) as ApiResponse<RecurringCreateResult>;
  return extractData(response);
}

export async function apiUpdateClassSession(id: string, payload: ClassSessionPayload, scope?: RecurrenceScope) {
  const response = (await api.put(`/class-sessions/${id}`, payload, {
    params: scope ? { scope } : undefined,
  })) as ApiResponse<ClassSessionRecord>;
  return extractData(response);
}

export async function apiCancelClassSession(id: string, scope?: RecurrenceScope) {
  const response = (await api.patch(`/class-sessions/${id}/cancel`, null, {
    params: scope ? { scope } : undefined,
  })) as ApiResponse<ClassSessionRecord>;
  return extractData(response);
}

export async function apiDeleteClassSession(id: string) {
  const response = (await api.delete(`/class-sessions/${id}`)) as ApiResponse;
  return unwrapResponse(response);
}
