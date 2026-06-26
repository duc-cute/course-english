import type { QuestionType } from "../../api/question";

export type AiDraftChoice = {
  choiceKey: string;
  choiceText: string;
  correct?: boolean;
  displayOrder?: number;
};

export type AiDraftQuestion = {
  tempId: string;
  selected: boolean;
  validationErrors?: string[];
  questionType: QuestionType;
  promptText: string;
  promptLang?: string;
  explanation?: string;
  difficulty?: number;
  choices?: AiDraftChoice[];
  /** Object in API response; string after round-trip */
  contentJson?: Record<string, unknown> | string;
};

export type AiQuestionGenEnvelope = {
  schemaVersion: number;
  questions: AiDraftQuestion[];
  meta?: {
    sourcePageRange?: string;
    model?: string;
    requestedTypes?: QuestionType[];
    requestedCount?: number;
    validCount?: number;
    invalidCount?: number;
    generationMode?: string;
    batchCount?: number;
    summaryMessage?: string;
  };
};

export type AiGenQuestionType = Extract<
  QuestionType,
  "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "READING_COMPREHENSION"
>;

export const AI_GEN_QUESTION_TYPE_OPTIONS: { value: AiGenQuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (MCQ)" },
  { value: "TRUE_FALSE", label: "Đúng / Sai" },
  { value: "FILL_BLANK", label: "Điền khuyết" },
  { value: "READING_COMPREHENSION", label: "Đọc hiểu (passage + câu con)" },
];

function parseContentJsonObject(
  contentJson: AiDraftQuestion["contentJson"],
): Record<string, unknown> | null {
  if (!contentJson) return null;
  if (typeof contentJson === "object") return contentJson;
  try {
    const parsed = JSON.parse(contentJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** One-line summary for preview list */
export function aiDraftSummaryLine(draft: AiDraftQuestion): string {
  if (draft.questionType === "READING_COMPREHENSION") {
    const payload = parseContentJsonObject(draft.contentJson);
    const passage = payload?.passage as { title?: string; text?: string } | undefined;
    const title = passage?.title?.trim() || draft.promptText?.trim();
    if (title) return title.length > 72 ? `${title.slice(0, 72)}…` : title;
    const text = passage?.text?.trim() ?? "";
    if (text) return text.length > 72 ? `${text.slice(0, 72)}…` : text;
    const subs = Array.isArray(payload?.subQuestions) ? payload.subQuestions.length : 0;
    return subs > 0 ? `Đọc hiểu — ${subs} câu con` : "Đọc hiểu";
  }
  const text = draft.promptText?.trim() ?? "";
  return text.length > 72 ? `${text.slice(0, 72)}…` : text || "—";
}
