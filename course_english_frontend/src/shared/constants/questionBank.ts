import type { QuestionStatus, QuestionType } from "../api/question";

export type QuestionSortOption = "createdAt,desc" | "updatedAt,desc";

export const QUESTION_SORT_OPTIONS: { value: QuestionSortOption; label: string }[] = [
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "updatedAt,desc", label: "Sửa gần đây" },
];

export const QUESTION_STATUS_OPTIONS: { value: QuestionStatus; label: string }[] = [
  { value: "DRAFT", label: "Nháp" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

export const QUESTION_DIFFICULTY_OPTIONS = [
  { value: "", label: "Mọi độ khó" },
  { value: "1", label: "★☆☆☆☆ Rất dễ" },
  { value: "2", label: "★★☆☆☆ Dễ" },
  { value: "3", label: "★★★☆☆ Trung bình" },
  { value: "4", label: "★★★★☆ Khó" },
  { value: "5", label: "★★★★★ Rất khó" },
];

export const QUESTION_CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const QUESTION_CEFR_OPTIONS = [
  { value: "", label: "Mọi CEFR" },
  ...QUESTION_CEFR_LEVELS.map((v) => ({ value: v, label: v })),
];

export const QUESTION_SKILLS = [
  { value: "", label: "Mọi kỹ năng" },
  { value: "VOCABULARY", label: "Từ vựng" },
  { value: "GRAMMAR", label: "Ngữ pháp" },
  { value: "READING", label: "Đọc hiểu" },
  { value: "LISTENING", label: "Nghe" },
  { value: "WRITING", label: "Viết" },
  { value: "SPEAKING", label: "Nói" },
];

export const QUESTION_SOURCE_OPTIONS = [
  { value: "", label: "Mọi nguồn" },
  { value: "MANUAL", label: "Thủ công" },
  { value: "IMPORT", label: "Import" },
  { value: "AI", label: "AI" },
  { value: "LESSON", label: "Lesson" },
  { value: "EXAM", label: "Exam" },
];

export const QUESTION_SKILL_LABELS: Record<string, string> = {
  VOCABULARY: "Từ vựng",
  GRAMMAR: "Ngữ pháp",
  READING: "Đọc hiểu",
  LISTENING: "Nghe",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export function skillLabel(skill?: string): string {
  if (!skill) return "—";
  return QUESTION_SKILL_LABELS[skill.toUpperCase()] ?? skill;
}

/** Types shown in Phase 1 filter (full list in API; editor still MCQ-only until Phase 2) */
export const QUESTION_TYPE_FILTER_OPTIONS: { value: "" | QuestionType; label: string }[] = [
  { value: "", label: "Mọi loại" },
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (MCQ)" },
  { value: "TRUE_FALSE", label: "Đúng / Sai" },
  { value: "FILL_BLANK", label: "Điền từ" },
  { value: "GAP_FILL_MCQ", label: "Điền + MCQ" },
  { value: "MATCHING", label: "Nối cặp" },
  { value: "READING_COMPREHENSION", label: "Đọc hiểu" },
  { value: "REORDER_SENTENCE", label: "Sắp xếp câu" },
  { value: "LISTEN_CHOOSE", label: "Nghe chọn" },
  { value: "SPELLING", label: "Chính tả" },
  { value: "LISTEN_TYPE", label: "Nghe gõ" },
];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "Đúng/Sai",
  FILL_BLANK: "Điền từ",
  GAP_FILL_MCQ: "Điền+MCQ",
  MATCHING: "Nối cặp",
  READING_COMPREHENSION: "Đọc hiểu",
  REORDER_SENTENCE: "Sắp xếp",
  LISTEN_CHOOSE: "Nghe chọn",
  SPELLING: "Chính tả",
  LISTEN_TYPE: "Nghe gõ",
};

export function questionTypeLabel(type?: QuestionType): string {
  if (!type) return "—";
  return QUESTION_TYPE_LABELS[type] ?? type;
}

export function difficultyStars(difficulty?: number): string {
  if (!difficulty || difficulty < 1 || difficulty > 5) return "—";
  return "★".repeat(difficulty) + "☆".repeat(5 - difficulty);
}

export function truncatePrompt(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function statusLabel(status?: QuestionStatus): string {
  if (status === "PUBLISHED") return "Published";
  if (status === "ARCHIVED") return "Lưu trữ";
  return "Nháp";
}
