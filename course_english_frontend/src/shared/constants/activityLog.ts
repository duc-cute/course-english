export const ACTIVITY_LOG_SEVERITY_OPTIONS = [
  { value: "", name: "Tất cả mức độ" },
  { value: "ERROR", name: "Lỗi" },
  { value: "WARN", name: "Cảnh báo" },
  { value: "INFO", name: "Thông tin" },
] as const;

export const ACTIVITY_LOG_MODULE_OPTIONS = [
  { value: "", name: "Tất cả module" },
  { value: "AI", name: "AI" },
  { value: "STORY", name: "Story / đọc sách" },
  { value: "API", name: "API" },
  { value: "SYSTEM", name: "Hệ thống" },
] as const;

export const ACTIVITY_LOG_ACTION_OPTIONS = [
  { value: "", name: "Tất cả hành động" },
  { value: "AI_GEN_TASK_CREATED", name: "Tạo tác vụ sinh câu" },
  { value: "AI_GEN_START", name: "Worker bắt đầu sinh câu" },
  { value: "AI_GEN_SKIP", name: "Worker bỏ qua / kích hoạt lại" },
  { value: "AI_DOC_READY", name: "Text tài liệu sẵn sàng" },
  { value: "AI_GEN_POLL_TIMEOUT", name: "UI poll timeout" },
  { value: "AI_GEN_PROMPT", name: "Ghép prompt gửi AI" },
  { value: "AI_OR_ROUND", name: "Gọi / nhận OpenRouter" },
  { value: "AI_GEN_RESPONSE", name: "Hoàn thành sinh câu" },
  { value: "AI_GEN_FAILED", name: "Sinh câu hỏi thất bại" },
  { value: "AI_GEN_QUOTA", name: "Hết quota sinh câu" },
  { value: "AI_OR_ERROR", name: "OpenRouter lỗi" },
  { value: "AI_OR_TIMEOUT", name: "OpenRouter timeout" },
  { value: "AI_JSON_INVALID", name: "JSON AI không hợp lệ" },
  { value: "API_ERROR", name: "API lỗi" },
  { value: "STORY_AUDIO_QUEUE", name: "Story — xếp hàng sinh audio" },
  { value: "STORY_AUDIO_START", name: "Story — worker bắt đầu TTS" },
  { value: "STORY_AUDIO_READY", name: "Story — audio sẵn sàng" },
  { value: "STORY_AUDIO_FAIL", name: "Story — sinh audio thất bại" },
  { value: "STORY_AUDIO_CACHE", name: "Story — audio cache hit" },
] as const;

export function activityLogActionLabel(action?: string): string {
  const found = ACTIVITY_LOG_ACTION_OPTIONS.find((item) => item.value === action);
  return found?.name ?? action ?? "—";
}

export function activityLogSeverityLabel(severity?: string): string {
  const found = ACTIVITY_LOG_SEVERITY_OPTIONS.find((item) => item.value === severity);
  return found?.name ?? severity ?? "—";
}
