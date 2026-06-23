import type { AiConversationRecord, AiMessageRecord } from "../api/ai";

export const MAX_AI_INPUT_LENGTH = 2000;

// Tạm ẩn gợi ý nhanh popup — bật lại khi cần
// export const WIDGET_SUGGESTION_CHIPS = ["Grammar check", "Translate", "Vocabulary"];

export function renderConversationTitle(item: AiConversationRecord): string {
  const title = item.title?.trim();
  if (title) return title;
  return "New conversation";
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString();
}

export function formatMessageTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function sortMessagesChronologically(messages: AiMessageRecord[]): AiMessageRecord[] {
  return [...messages].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    if (a.role === "USER" && b.role !== "USER") return -1;
    if (a.role !== "USER" && b.role === "USER") return 1;
    return 0;
  });
}
