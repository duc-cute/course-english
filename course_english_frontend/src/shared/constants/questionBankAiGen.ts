import type { QuestionStatus } from "../api/question";
import type { AiGenQuestionType } from "../ai/questionGen/types";

/** AI-1: types supported by bank editor + draftToExercise. AI-2b adds GAP_FILL_MCQ later. */
export const BANK_AI_GEN_QUESTION_TYPES: { value: AiGenQuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (MCQ)" },
  { value: "TRUE_FALSE", label: "Đúng / Sai" },
  { value: "FILL_BLANK", label: "Điền từ" },
];

export const BANK_AI_GEN_TYPE_VALUES = new Set(
  BANK_AI_GEN_QUESTION_TYPES.map((o) => o.value),
);

export const BANK_AI_GEN_DEFAULTS = {
  languageLevel: "A2",
  skill: "VOCABULARY",
  questionType: "MULTIPLE_CHOICE" as AiGenQuestionType,
  questionCount: 10,
  difficulty: 2,
  status: "DRAFT" as QuestionStatus,
  promptLang: "en",
};

export const BANK_AI_GEN_SKILL_OPTIONS = [
  { value: "VOCABULARY", label: "Từ vựng" },
  { value: "GRAMMAR", label: "Ngữ pháp" },
  { value: "READING", label: "Đọc hiểu" },
  { value: "LISTENING", label: "Nghe" },
  { value: "WRITING", label: "Viết" },
  { value: "SPEAKING", label: "Nói" },
];

export function topicTagSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}
