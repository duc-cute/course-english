import { compareTypedAnswers } from "./answerNormalize";
import type { FillBlankQuestion, FillBlankSlot } from "../../student/lessonPlayer/exercise/types";

export const FILL_BLANK_TOKEN = "___";
export const MAX_FILL_BLANK_SLOTS = 12;

export type FillBlankSegment =
  | { kind: "text"; value: string }
  | { kind: "blank"; blankId: string };

const BRACE_BLANK_RE = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

export function normalizeFillBlankPrompt(promptText: string): string {
  return promptText.replace(/_{3,}/g, FILL_BLANK_TOKEN);
}

export function countBlankPlaceholders(promptText: string): number {
  const plain = (promptText.match(/_{3,}/g) ?? []).length;
  const braces = new Set<string>();
  for (const match of promptText.matchAll(BRACE_BLANK_RE)) {
    if (match[1]) braces.add(match[1]);
  }
  return plain + braces.size;
}

export function syncBlanksWithPrompt(promptText: string, existing: FillBlankSlot[]): FillBlankSlot[] {
  const count = Math.min(countBlankPlaceholders(promptText), MAX_FILL_BLANK_SLOTS);
  if (count <= 0) {
    const preserved = existing[0];
    return [
      {
        id: "b1",
        acceptedAnswers: preserved?.acceptedAnswers?.length ? [...preserved.acceptedAnswers] : [""],
        placeholder: preserved?.placeholder,
      },
    ];
  }

  const next: FillBlankSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `b${i + 1}`;
    const prev = existing.find((b) => b.id === id) ?? existing[i];
    next.push({
      id,
      acceptedAnswers: prev?.acceptedAnswers?.length ? [...prev.acceptedAnswers] : [""],
      placeholder: prev?.placeholder,
    });
  }
  return next;
}

export function normalizeFillBlankQuestion(question: FillBlankQuestion): FillBlankQuestion {
  return {
    ...question,
    blanks: syncBlanksWithPrompt(question.prompt.text, question.blanks),
  };
}

export function parseFillBlankPrompt(promptText: string, blanks: FillBlankSlot[]): FillBlankSegment[] {
  const segments: FillBlankSegment[] = [];
  let blankIndex = 0;
  let textStart = 0;
  let scan = 0;

  const pushTextUpTo = (end: number) => {
    if (end > textStart) {
      segments.push({ kind: "text", value: promptText.slice(textStart, end) });
      textStart = end;
    }
  };

  while (scan < promptText.length) {
    const blankRun = promptText.slice(scan).match(/^_{3,}/);
    if (blankRun) {
      pushTextUpTo(scan);
      const blank = blanks[blankIndex] ?? blanks[blanks.length - 1];
      segments.push({ kind: "blank", blankId: blank?.id ?? `b${blankIndex + 1}` });
      blankIndex += 1;
      scan += blankRun[0].length;
      textStart = scan;
      continue;
    }

    const braceMatch = promptText.slice(scan).match(/^\{\{([a-zA-Z0-9_-]+)\}\}/);
    if (braceMatch) {
      pushTextUpTo(scan);
      segments.push({ kind: "blank", blankId: braceMatch[1] });
      scan += braceMatch[0].length;
      textStart = scan;
      continue;
    }

    scan += 1;
  }

  pushTextUpTo(promptText.length);

  if (!segments.length && promptText.trim()) {
    segments.push({ kind: "text", value: promptText });
  }

  return segments;
}

export function isFillBlankComplete(
  userAnswers: Record<string, string>,
  blanks: FillBlankSlot[],
): boolean {
  return blanks.length > 0 && blanks.every((b) => (userAnswers[b.id] ?? "").trim().length > 0);
}

export function compareFillBlankAnswers(
  userAnswers: Record<string, string>,
  blanks: FillBlankSlot[],
  caseSensitive = false,
): boolean {
  if (!blanks.length) return false;
  return blanks.every((blank) => {
    const accepted = blank.acceptedAnswers.map((a) => a.trim()).filter(Boolean);
    if (!accepted.length) return false;
    const user = userAnswers[blank.id] ?? "";
    return accepted.some((answer) => compareTypedAnswers(user, answer, { caseSensitive }));
  });
}

export function formatAcceptedAnswers(acceptedAnswers: string[]): string {
  return acceptedAnswers.filter((a) => a.trim()).join(", ");
}

export function parseAcceptedAnswersInput(input: string): string[] {
  return input
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
