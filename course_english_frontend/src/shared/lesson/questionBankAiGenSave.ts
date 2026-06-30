import { draftToExerciseQuestion } from "../ai/questionGen/draftToExercise";
import type { AiDraftQuestion } from "../ai/questionGen/types";
import { aiGenLog } from "../ai/questionGen/aiGenLogger";
import { isBankAiDraftValid } from "../ai/questionGen/bankDraftValidate";
import { apiCreateQuestion } from "../api/question";
import {
  exerciseQuestionToQuestionForm,
  QUESTION_BANK_EDITABLE_TYPES,
  type QuestionFormMeta,
} from "./questionBankUtils";
import type { BankImportBatchResult } from "./questionBankImport";

export type BankAiSaveMeta = QuestionFormMeta & {
  topic: string;
};

export type BankAiSaveDraftItem = {
  draft: AiDraftQuestion;
  title?: string;
};

export async function saveAiDraftsToBank(
  items: BankAiSaveDraftItem[],
  meta: BankAiSaveMeta,
): Promise<BankImportBatchResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;
  const startedAt = Date.now();

  aiGenLog("info", {
    scope: "question-bank",
    event: "bank_save_start",
    total: items.length,
    topic: meta.topic,
  });

  for (const { draft, title } of items) {
    if (!isBankAiDraftValid(draft)) continue;

    const question = draftToExerciseQuestion(draft);
    if (
      !question ||
      !QUESTION_BANK_EDITABLE_TYPES.includes(
        question.type as (typeof QUESTION_BANK_EDITABLE_TYPES)[number],
      )
    ) {
      failed += 1;
      errors.push(`${draft.promptText?.slice(0, 60) || draft.tempId}: Không chuyển được sang câu hỏi`);
      continue;
    }

    const payload = exerciseQuestionToQuestionForm(question, {
      ...meta,
      title: title?.trim() || undefined,
      source: "AI",
      aiGenerated: true,
    });

    try {
      await apiCreateQuestion(payload);
      imported += 1;
    } catch (err) {
      failed += 1;
      const msg = (err as { message?: string })?.message ?? "Lỗi không xác định";
      const label = title?.trim() || question.prompt?.text?.slice(0, 60) || draft.tempId;
      errors.push(`${label}: ${msg}`);
      aiGenLog("warn", {
        scope: "question-bank",
        event: "bank_save_item_failed",
        questionType: question.type,
        message: msg,
      });
    }
  }

  aiGenLog("info", {
    scope: "question-bank",
    event: "bank_save_done",
    imported,
    failed,
    elapsedMs: Date.now() - startedAt,
  });

  return { imported, failed, errors };
}

/** @deprecated use saveAiDraftsToBank — kept for callers that already have ExerciseQuestion[] */
export async function saveAiQuestionsToBank(
  questions: import("../../student/lessonPlayer/exercise/types").ExerciseQuestion[],
  meta: BankAiSaveMeta,
): Promise<BankImportBatchResult> {
  const items: BankAiSaveDraftItem[] = questions.map((q) => ({
    draft: {
      tempId: q.id,
      selected: true,
      questionType: q.type,
      promptText: q.prompt?.text ?? "",
      promptLang: q.prompt?.lang,
      explanation: q.explanation,
      choices:
        q.type === "MULTIPLE_CHOICE"
          ? q.choices.map((c) => ({
              choiceKey: c.id,
              choiceText: c.text,
              correct: c.id === q.correctChoiceId,
            }))
          : undefined,
      contentJson:
        q.type === "TRUE_FALSE"
          ? { correctAnswer: q.correctAnswer }
          : q.type === "FILL_BLANK"
            ? { blanks: q.blanks }
            : undefined,
    },
  }));
  return saveAiDraftsToBank(items, meta);
}
