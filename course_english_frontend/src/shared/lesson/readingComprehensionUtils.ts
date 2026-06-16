import type { ReadingSubQuestion } from "../../student/lessonPlayer/exercise/types";

export const READING_PRESENTATION_SPLIT = "split";
export const READING_PRESENTATION_STEPPED = "stepped";

export type ReadingPresentation = typeof READING_PRESENTATION_SPLIT | typeof READING_PRESENTATION_STEPPED;

export const READING_PRESENTATION_OPTIONS: { value: ReadingPresentation; label: string }[] = [
  { value: READING_PRESENTATION_SPLIT, label: "Split — đoạn + tất cả câu" },
  { value: READING_PRESENTATION_STEPPED, label: "Stepped — từng câu một" },
];

export function subQuestionChoiceOrderKey(questionId: string, subId: string): string {
  return `${questionId}::${subId}`;
}

export function isReadingComprehensionComplete(
  subAnswers: Record<string, string>,
  subQuestions: ReadingSubQuestion[],
): boolean {
  return (
    subQuestions.length > 0 &&
    subQuestions.every((sq) => Boolean(subAnswers[sq.id]?.trim()))
  );
}

export function scoreReadingComprehension(
  subQuestions: ReadingSubQuestion[],
  subAnswers: Record<string, string>,
): {
  correctSubCount: number;
  totalSubQuestions: number;
  allCorrect: boolean;
  perSub: Record<string, boolean>;
} {
  const perSub: Record<string, boolean> = {};
  let correctSubCount = 0;

  for (const sub of subQuestions) {
    const ok = (subAnswers[sub.id] ?? "") === sub.correctChoiceId;
    perSub[sub.id] = ok;
    if (ok) correctSubCount += 1;
  }

  const totalSubQuestions = subQuestions.length;
  return {
    correctSubCount,
    totalSubQuestions,
    allCorrect: totalSubQuestions > 0 && correctSubCount === totalSubQuestions,
    perSub,
  };
}
