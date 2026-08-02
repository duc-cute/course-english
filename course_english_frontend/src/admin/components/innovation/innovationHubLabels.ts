import type {
  InnovationIdeaCategory,
  InnovationIdeaPriority,
  InnovationIdeaStatus,
} from "../../../shared/api/innovationHub";

export const INNOVATION_CATEGORY_OPTIONS: Array<{ value: InnovationIdeaCategory; label: string }> = [
  { value: "FEATURE", label: "Feature Suggestion" },
  { value: "BUG", label: "Bug Report" },
  { value: "UI", label: "UI" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "AI", label: "AI" },
  { value: "OTHER", label: "Other" },
];

export const INNOVATION_FILTER_CATEGORY_OPTIONS: Array<{ value: InnovationIdeaCategory | ""; label: string }> = [
  { value: "", label: "Tất cả danh mục" },
  ...INNOVATION_CATEGORY_OPTIONS,
];

export const INNOVATION_STATUS_OPTIONS: Array<{ value: InnovationIdeaStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "UNDER_REVIEW", label: "Reviewing" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "TESTING", label: "Testing" },
  { value: "COMPLETED", label: "Completed" },
];

export const INNOVATION_STATUS_LABEL_VI: Record<InnovationIdeaStatus, string> = {
  UNDER_REVIEW: "Đang xem xét",
  PLANNED: "Đang lên kế hoạch",
  IN_PROGRESS: "Đang phát triển",
  TESTING: "Đang kiểm thử",
  COMPLETED: "Đã hoàn thành",
};

export const INNOVATION_PRIORITY_OPTIONS: InnovationIdeaPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const INNOVATION_PRIORITY_LABEL_VI: Record<InnovationIdeaPriority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

export function innovationCategoryLabel(category?: string) {
  return INNOVATION_CATEGORY_OPTIONS.find((o) => o.value === category)?.label || category || "Other";
}

export function innovationStatusLabel(status?: string) {
  if (!status) return "—";
  return INNOVATION_STATUS_LABEL_VI[status as InnovationIdeaStatus] || status;
}

export function formatInnovationRelativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}
