import api from "./axios";
import type { ApiResponse } from "./types";

export type NotificationType = "LESSON_PUBLISHED" | "PRACTICE_SUBMITTED" | "EXAM_ASSIGNED";

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkPath: string;
  read: boolean;
  readAt?: string | null;
  createdAt?: string;
  payload?: Record<string, unknown>;
};

export type NotificationsPaginationResult = {
  result?: NotificationRecord[];
  meta?: {
    page?: number;
    pageSize?: number;
    pages?: number;
    total?: number;
  };
};

export type NotificationSearchPayload = {
  page?: number;
  size?: number;
  sort?: string;
  unreadOnly?: boolean;
};

export type NotificationWsMessage = {
  type: "NOTIFICATION_CREATED";
  notification: NotificationRecord;
  unreadCount: number;
};

function normalizeNotificationRecord(raw: NotificationRecord): NotificationRecord {
  return {
    ...raw,
    id: String(raw.id),
    read: Boolean(raw.read),
    payload: raw.payload ?? {},
  };
}

export function normalizeNotificationWsMessage(message: NotificationWsMessage): NotificationWsMessage {
  return {
    ...message,
    notification: normalizeNotificationRecord(message.notification),
  };
}

function unwrapData<T>(response: ApiResponse<T>): T {
  const statusCode = response?.statusCode;
  if (typeof statusCode === "number" && statusCode >= 400) {
    throw new Error(response?.message || "API request failed");
  }
  if (response?.success === false) {
    throw new Error(response?.message || "API request failed");
  }
  return response.data as T;
}

export async function apiSearchNotifications(
  payload?: NotificationSearchPayload,
): Promise<NotificationsPaginationResult> {
  const response = (await api.post(
    "/notifications/search",
    payload ?? {},
  )) as ApiResponse<NotificationsPaginationResult>;
  return unwrapData(response);
}

export async function apiGetNotificationUnreadCount(): Promise<number> {
  const response = (await api.get("/notifications/unread-count")) as ApiResponse<{ count: number }>;
  const data = unwrapData(response);
  return data?.count ?? 0;
}

export async function apiMarkNotificationRead(id: string): Promise<NotificationRecord> {
  const response = (await api.post(`/notifications/${id}/read`)) as ApiResponse<NotificationRecord>;
  return unwrapData(response);
}

export async function apiMarkAllNotificationsRead(): Promise<number> {
  const response = (await api.post("/notifications/read-all")) as ApiResponse<{ updatedCount: number }>;
  const data = unwrapData(response);
  return data?.updatedCount ?? 0;
}
