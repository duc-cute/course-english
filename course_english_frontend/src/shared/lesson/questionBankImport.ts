import { apiCreateQuestion, type QuestionFormPayload, type QuestionStatus } from "../api/question";
import type { MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";
import type { ExerciseImportResult } from "./exerciseImport";
import { mcqToQuestionForm } from "./questionBankUtils";

export type BankImportOptions = {
  categoryId?: string;
  status?: QuestionStatus;
};

export type BankImportBatchResult = {
  imported: number;
  failed: number;
  errors: string[];
};

export function extractMcqFromImportResult(result: ExerciseImportResult): MultipleChoiceQuestion[] {
  if (!result.payload?.questions?.length) {
    return [];
  }
  return result.payload.questions.filter((q): q is MultipleChoiceQuestion => q.type === "MULTIPLE_CHOICE");
}

export async function importMcqQuestionsToBank(
  questions: MultipleChoiceQuestion[],
  options: BankImportOptions,
): Promise<BankImportBatchResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (const mcq of questions) {
    const payload: QuestionFormPayload = mcqToQuestionForm(mcq, {
      categoryId: options.categoryId,
      status: options.status ?? "PUBLISHED",
      source: "IMPORT",
    });
    try {
      await apiCreateQuestion(payload);
      imported += 1;
    } catch (err) {
      failed += 1;
      const msg = (err as { message?: string })?.message ?? "Lỗi không xác định";
      errors.push(`${mcq.prompt.text || mcq.id}: ${msg}`);
    }
  }

  return { imported, failed, errors };
}
