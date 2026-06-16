import { countBlankPlaceholders, parseFillBlankPrompt } from "./fillBlankUtils";
import type { ExerciseChoice, GapFillMcqBlank } from "../../student/lessonPlayer/exercise/types";

export const GAP_FILL_MCQ_CHOICE_IDS = ["a", "b", "c", "d"] as const;
export const MAX_GAP_FILL_BLANKS = 12;

export function createDefaultGapFillChoices(): ExerciseChoice[] {
  return GAP_FILL_MCQ_CHOICE_IDS.map((id) => ({ id, text: "" }));
}

export function syncGapFillBlanksWithPrompt(
  promptText: string,
  existing: GapFillMcqBlank[],
): GapFillMcqBlank[] {
  const count = countBlankPlaceholders(promptText);
  if (count <= 0) {
    return existing.length
      ? existing
      : [
          {
            id: "b1",
            choices: createDefaultGapFillChoices(),
            correctChoiceId: "a",
          },
        ];
  }

  const next: GapFillMcqBlank[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `b${i + 1}`;
    const prev = existing.find((b) => b.id === id) ?? existing[i];
    const choices =
      prev?.choices?.length === 4
        ? prev.choices.map((c) => ({ ...c }))
        : createDefaultGapFillChoices();
    const correctChoiceId = choices.some((c) => c.id === prev?.correctChoiceId)
      ? prev!.correctChoiceId
      : "a";
    next.push({ id, choices, correctChoiceId });
  }
  return next;
}

export function gapFillChoiceOrderKey(questionId: string, blankId: string): string {
  return `${questionId}::${blankId}`;
}

export function isGapFillMcqComplete(
  userAnswers: Record<string, string>,
  blanks: GapFillMcqBlank[],
): boolean {
  return blanks.length > 0 && blanks.every((b) => Boolean(userAnswers[b.id]?.trim()));
}

export function scoreGapFillMcqBlank(
  blank: GapFillMcqBlank,
  selectedChoiceId: string | undefined,
): boolean {
  if (!selectedChoiceId?.trim()) return false;
  return selectedChoiceId === blank.correctChoiceId;
}

export function scoreGapFillMcq(
  blanks: GapFillMcqBlank[],
  userAnswers: Record<string, string>,
): {
  correctBlankCount: number;
  totalBlanks: number;
  allCorrect: boolean;
  perBlank: Record<string, boolean>;
} {
  const perBlank: Record<string, boolean> = {};
  let correctBlankCount = 0;
  for (const blank of blanks) {
    const ok = scoreGapFillMcqBlank(blank, userAnswers[blank.id]);
    perBlank[blank.id] = ok;
    if (ok) correctBlankCount += 1;
  }
  const totalBlanks = blanks.length;
  return {
    correctBlankCount,
    totalBlanks,
    allCorrect: totalBlanks > 0 && correctBlankCount === totalBlanks,
    perBlank,
  };
}

export { parseFillBlankPrompt, countBlankPlaceholders };
