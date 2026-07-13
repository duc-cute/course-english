import {
  isVocabPracticePassed,
  type VocabularyPracticeSummaryItem,
} from "../../shared/api/vocabularyPracticeAttempt";

export type DueBadgeInfo = {
  kind: "overdue" | "due-soon" | "due";
  label: string;
};

/** Days remaining until end of due date (local). Negative = overdue. */
export function daysUntilDue(dueAt?: string | null): number | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  const end = new Date(due);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function getDueBadge(dueAt?: string | null): DueBadgeInfo | null {
  const days = daysUntilDue(dueAt);
  if (days == null) return null;
  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      kind: "overdue",
      label: overdue === 1 ? "Quá hạn 1 ngày" : `Quá hạn ${overdue} ngày`,
    };
  }
  if (days === 0) {
    return { kind: "due-soon", label: "Hết hạn hôm nay" };
  }
  if (days <= 3) {
    return {
      kind: "due-soon",
      label: days === 1 ? "Còn 1 ngày" : `Còn ${days} ngày`,
    };
  }
  return {
    kind: "due",
    label: `Hạn: ${new Date(dueAt!).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`,
  };
}

export function vocabContinueCta(
  practiceSummary?: VocabularyPracticeSummaryItem | null,
): string {
  const best = practiceSummary?.best;
  if (!best) return "Học →";
  if (isVocabPracticePassed(best)) return "Ôn lại →";
  return "Làm lại →";
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Chưa học";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Cập nhật hôm nay";
    if (diffDays === 1) return "Cập nhật 1 ngày trước";
    if (diffDays < 7) return `Cập nhật ${diffDays} ngày trước`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "Cập nhật 1 tuần trước";
    if (diffWeeks < 4) return `Cập nhật ${diffWeeks} tuần trước`;
    return `Cập nhật ${date.toLocaleDateString("vi-VN")}`;
  } catch {
    return "";
  }
}
