import { compareTypedAnswers } from "./answerNormalize";
import type { FillBlankSlot } from "../../student/lessonPlayer/exercise/types";

export const FILL_BLANK_TOKEN = "___";

export type FillBlankSegment =
  | { kind: "text"; value: string }
  | { kind: "blank"; blankId: string };

const BRACE_BLANK_RE = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

export function countBlankPlaceholders(promptText: string): number {
  const plain = (promptText.match(/___/g) ?? []).length;
  const braces = new Set<string>();
  for (const match of promptText.matchAll(BRACE_BLANK_RE)) {
    if (match[1]) braces.add(match[1]);
  }
  return plain + braces.size;
}

export function syncBlanksWithPrompt(promptText: string, existing: FillBlankSlot[]): FillBlankSlot[] {
  const count = countBlankPlaceholders(promptText);
  if (count <= 0) {
    return existing.length ? existing : [{ id: "b1", acceptedAnswers: [""] }];
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
    if (promptText.startsWith(FILL_BLANK_TOKEN, scan)) {
      pushTextUpTo(scan);
      const blank = blanks[blankIndex] ?? blanks[blanks.length - 1];
      segments.push({ kind: "blank", blankId: blank?.id ?? `b${blankIndex + 1}` });
      blankIndex += 1;
      scan += FILL_BLANK_TOKEN.length;
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
