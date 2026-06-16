import { scoreGapFillMcq } from "../../../shared/lesson/gapFillMcqUtils";
import { scoreReadingComprehension } from "../../../shared/lesson/readingComprehensionUtils";
import type { ExerciseAnswerSnapshot } from "../exerciseSessionStorage";
import type { ExerciseQuestion } from "./types";
import type { PreparedExerciseItem } from "./prepareExerciseItems";

/** Số đơn vị chấm điểm — GAP_FILL_MCQ = số ô trống, còn lại = 1/câu. */
export function getQuestionScoringUnits(question: ExerciseQuestion): number {
  if (question.type === "GAP_FILL_MCQ") {
    return Math.max(1, question.blanks.length);
  }
  if (question.type === "READING_COMPREHENSION") {
    return Math.max(1, question.subQuestions.length);
  }
  return 1;
}

export function getAnswerCorrectUnits(
  question: ExerciseQuestion,
  answer: ExerciseAnswerSnapshot | undefined,
): number {
  if (!answer) return 0;

  if (question.type === "GAP_FILL_MCQ") {
    if (typeof answer.correctBlankCount === "number") {
      return answer.correctBlankCount;
    }
    const scored = scoreGapFillMcq(question.blanks, answer.gapFillMcqAnswers ?? {});
    return scored.correctBlankCount;
  }

  if (question.type === "READING_COMPREHENSION") {
    if (typeof answer.correctSubCount === "number") {
      return answer.correctSubCount;
    }
    const scored = scoreReadingComprehension(
      question.subQuestions,
      answer.readingSubAnswers ?? {},
    );
    return scored.correctSubCount;
  }

  return answer.correct ? 1 : 0;
}

export function computeSessionScore(
  items: PreparedExerciseItem[],
  answers: Record<string, ExerciseAnswerSnapshot>,
): { correctUnits: number; totalUnits: number; scorePct: number } {
  let correctUnits = 0;
  let totalUnits = 0;

  for (const item of items) {
    const question = item.displayQuestion;
    const units = getQuestionScoringUnits(question);
    totalUnits += units;
    correctUnits += getAnswerCorrectUnits(question, answers[question.id]);
  }

  const scorePct = totalUnits > 0 ? Math.round((correctUnits / totalUnits) * 100) : 0;
  return { correctUnits, totalUnits, scorePct };
}
