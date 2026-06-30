import { countBlankPlaceholders, normalizeFillBlankPrompt } from "../../lesson/fillBlankUtils";
import type { AiDraftQuestion } from "./types";
import { BANK_AI_GEN_TYPE_VALUES } from "../../constants/questionBankAiGen";

function parseContentJson(contentJson: AiDraftQuestion["contentJson"]): Record<string, unknown> | null {
  if (!contentJson) return null;
  if (typeof contentJson === "object") return contentJson;
  try {
    const parsed = JSON.parse(contentJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function computeValidationErrors(draft: AiDraftQuestion): string[] {
  const errors: string[] = [];

  if (!BANK_AI_GEN_TYPE_VALUES.has(draft.questionType)) {
    errors.push("Loại câu không hỗ trợ Question Bank");
    return errors;
  }

  const stem = draft.promptText?.trim() ?? "";
  if (!stem) {
    errors.push("Thiếu đề bài (stem)");
  }

  if (draft.questionType === "MULTIPLE_CHOICE") {
    const choices = draft.choices ?? [];
    const filled = choices.filter((c) => c.choiceText?.trim());
    if (filled.length < 2) {
      errors.push("Cần ít nhất 2 đáp án có nội dung");
    }
    if (!choices.some((c) => c.correct)) {
      errors.push("Chưa đánh dấu đáp án đúng");
    }
  }

  if (draft.questionType === "TRUE_FALSE") {
    const payload = parseContentJson(draft.contentJson);
    if (typeof payload?.correctAnswer !== "boolean") {
      errors.push("Chưa chọn Đúng hoặc Sai");
    }
  }

  if (draft.questionType === "FILL_BLANK") {
    const promptText = normalizeFillBlankPrompt(draft.promptText ?? "");
    const placeholderCount = countBlankPlaceholders(promptText);
    if (placeholderCount < 1 && !promptText.includes("___")) {
      errors.push("Stem cần có chỗ trống (___ hoặc {{blank}})");
    }
    const payload = parseContentJson(draft.contentJson);
    const rawBlanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
    const hasAnswer = rawBlanks.some((b) => {
      const row = b as { acceptedAnswers?: string[] };
      return Array.isArray(row.acceptedAnswers) && row.acceptedAnswers.some((a) => a?.trim());
    });
    if (!hasAnswer) {
      errors.push("Thiếu đáp án chấp nhận cho chỗ trống");
    }
  }

  return errors;
}

export function isBankAiDraftValid(draft: AiDraftQuestion): boolean {
  return computeValidationErrors(draft).length === 0;
}

/** Re-run FE validation after manual edits; clears or sets validationErrors. */
export function revalidateBankAiDraft(draft: AiDraftQuestion): AiDraftQuestion {
  const hadErrors = (draft.validationErrors?.length ?? 0) > 0;
  const errors = computeValidationErrors(draft);
  const valid = errors.length === 0;

  return {
    ...draft,
    validationErrors: valid ? undefined : errors,
    selected: valid ? (hadErrors ? true : draft.selected !== false) : false,
  };
}

export function revalidateBankAiDrafts(drafts: AiDraftQuestion[]): AiDraftQuestion[] {
  return drafts.map(revalidateBankAiDraft);
}
