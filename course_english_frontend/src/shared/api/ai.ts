import api from "./axios";
import type { ApiResponse } from "./types";
import { refreshAccessToken } from "../auth/authSession";
import { isAccessTokenExpired } from "../auth/jwtUtils";
import { getAccessToken } from "../auth/token";

export type AiConversationRecord = {
  id: string;
  title?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
};

export type AiMessageRecord = {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  contentType: "TEXT" | "MARKDOWN";
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  status?: "COMPLETED" | "FAILED";
  createdAt?: string;
};

export type AiMessagePage = {
  items: AiMessageRecord[];
  hasMore: boolean;
  nextBefore?: string | null;
};

export type AiUsageDaily = {
  date: string;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
};

export type AiUsageStats = {
  aiEnabled: boolean;
  defaultModel: string;
  dailyRequestLimitPerUser: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  todayPromptTokens: number;
  todayCompletionTokens: number;
  todayTokens: number;
  todayRequests: number;
  totalRequests: number;
  totalConversations: number;
  activeUsers: number;
  last7Days: AiUsageDaily[];
};

type PaginationPayload<T> = {
  result?: T[];
  meta?: { page?: number; pageSize?: number; pages?: number; total?: number };
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
  return response;
}

export async function apiGetAiConversations(payload?: { page?: number; size?: number }) {
  const page = payload?.page ?? 0;
  const size = payload?.size ?? 20;
  const response = (await api.get(`/ai/conversations?page=${page}&size=${size}`)) as ApiResponse<
    PaginationPayload<AiConversationRecord>
  >;
  return unwrapResponse(response);
}

export async function apiCreateAiConversation(title?: string) {
  const response = (await api.post("/ai/conversations", { title })) as ApiResponse<{ id: string }>;
  return unwrapResponse(response);
}

export async function apiUpdateAiConversation(conversationId: string, title: string) {
  const response = (await api.patch(`/ai/conversations/${conversationId}`, { title })) as ApiResponse<AiConversationRecord>;
  return unwrapResponse(response);
}

export async function apiDeleteAiConversation(conversationId: string) {
  await api.delete(`/ai/conversations/${conversationId}`);
}

export async function apiGetAiMessages(conversationId: string, payload?: { limit?: number; before?: string | null }) {
  const limit = payload?.limit ?? 30;
  const before = payload?.before ? `&before=${encodeURIComponent(payload.before)}` : "";
  const response = (await api.get(
    `/ai/conversations/${conversationId}/messages?limit=${limit}${before}`,
  )) as ApiResponse<AiMessagePage>;
  return unwrapResponse(response);
}

export async function apiSendAiMessage(conversationId: string, content: string) {
  const response = (await api.post(`/ai/conversations/${conversationId}/messages`, { content })) as ApiResponse<AiMessageRecord>;
  return unwrapResponse(response);
}

export type AiStreamCallbacks = {
  onChunk: (delta: string) => void;
  onDone: (message: AiMessageRecord) => void;
  onError: (message: string) => void;
};

async function resolveAuthToken(): Promise<string | null> {
  let token = getAccessToken();
  if (token && isAccessTokenExpired(token)) {
    token = (await refreshAccessToken()) ?? null;
  }
  return token;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) return null;
  return { event, data: dataLines.join("\n") };
}

export async function apiSendAiMessageStream(
  conversationId: string,
  content: string,
  callbacks: AiStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const baseURL = import.meta.env.VITE_API_URL as string;
  const token = await resolveAuthToken();

  const response = await fetch(`${baseURL}/ai/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ content }),
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/event-stream")) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* not JSON */
    }
    callbacks.onError(message);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("Không đọc được phản hồi stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) continue;
      try {
        const payload = JSON.parse(parsed.data) as Record<string, unknown>;
        if (parsed.event === "chunk") {
          callbacks.onChunk(String(payload.delta ?? ""));
        } else if (parsed.event === "done") {
          callbacks.onDone(payload as AiMessageRecord);
        } else if (parsed.event === "error") {
          callbacks.onError(String(payload.message ?? "Stream error"));
        }
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
}

export async function apiGetAiUsageStats() {
  const response = (await api.get("/ai/usage/stats")) as ApiResponse<AiUsageStats>;
  return unwrapResponse(response);
}
