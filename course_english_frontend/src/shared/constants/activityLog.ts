export const ACTIVITY_LOG_SEVERITY_OPTIONS = [
  { value: "", name: "Tất cả mức độ" },
  { value: "ERROR", name: "Lỗi" },
  { value: "WARN", name: "Cảnh báo" },
  { value: "INFO", name: "Thông tin" },
] as const;

export const ACTIVITY_LOG_MODULE_OPTIONS = [
  { value: "", name: "Tất cả module" },
  { value: "AI", name: "AI" },
  { value: "API", name: "API" },
  { value: "SYSTEM", name: "Hệ thống" },
] as const;

export const ACTIVITY_LOG_ACTION_OPTIONS = [
  { value: "", name: "Tất cả hành động" },
  { value: "AI_GEN_TASK_CREATED", name: "Tạo tác vụ sinh câu" },
  { value: "AI_GEN_POLL_TIMEOUT", name: "UI poll timeout" },
  { value: "AI_GEN_PROMPT", name: "Gửi prompt sinh câu" },
  { value: "AI_GEN_RESPONSE", name: "Nhận phản hồi sinh câu" },
  { value: "AI_GEN_FAILED", name: "Sinh câu hỏi thất bại" },
  { value: "AI_GEN_QUOTA", name: "Hết quota sinh câu" },
  { value: "AI_OR_ERROR", name: "OpenRouter lỗi" },
  { value: "AI_OR_TIMEOUT", name: "OpenRouter timeout" },
  { value: "AI_JSON_INVALID", name: "JSON AI không hợp lệ" },
  { value: "API_ERROR", name: "API lỗi" },
] as const;

export function activityLogActionLabel(action?: string): string {
  const found = ACTIVITY_LOG_ACTION_OPTIONS.find((item) => item.value === action);
  return found?.name ?? action ?? "—";
}

export function activityLogSeverityLabel(severity?: string): string {
  const found = ACTIVITY_LOG_SEVERITY_OPTIONS.find((item) => item.value === severity);
  return found?.name ?? severity ?? "—";
}
