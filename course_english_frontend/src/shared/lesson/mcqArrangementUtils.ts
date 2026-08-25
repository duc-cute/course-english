import type { ExerciseChoice, MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";

export type McqArrangementItem = {
  key: string;
  text: string;
};

export const MCQ_LAYOUT_SENTENCE_ARRANGEMENT = "SENTENCE_ARRANGEMENT" as const;
export type McqLayout = typeof MCQ_LAYOUT_SENTENCE_ARRANGEMENT;

/** Choices like `d – e – b – c – a` or `b-e-d-c-a`. */
export function isPermutationChoiceText(text: string): boolean {
  const normalized = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s*,\s*/g, "-")
    .replace(/\s*-\s*/g, "-");
  return /^[a-e](-[a-e]){2,}$/i.test(normalized);
}

export function countPermutationChoices(choices: Pick<ExerciseChoice, "text">[]): number {
  return choices.filter((c) => isPermutationChoiceText(c.text)).length;
}

/** Drop A–D order lines that were wrongly stored as sentence items. */
export function sanitizeArrangementItems(items: McqArrangementItem[]): McqArrangementItem[] {
  const out: McqArrangementItem[] = [];
  for (const item of items) {
    const key = String(item.key ?? "").trim().toLowerCase();
    const text = String(item.text ?? "").trim();
    if (!key || !text) continue;
    if (isPermutationChoiceText(text)) break;
    out.push({ key, text: stripTrailingChoiceBlock(text) });
  }
  return out.filter((item) => item.text && !isPermutationChoiceText(item.text));
}

/**
 * Extract `a.` … `e.` sentence blocks from a flat prompt (AI/import often glues them).
 * Stops before glued MCQ options like `a. d – e – b – c – a`.
 */
export function extractArrangementItemsFromPrompt(promptText: string): McqArrangementItem[] {
  const normalized = promptText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const re = /(?:^|[\n\r])\s*([a-e])\.\s+/gi;
  const starts: { key: string; labelStart: number; contentStart: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    starts.push({
      key: match[1]!.toLowerCase(),
      labelStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  if (starts.length < 3) {
    return sanitizeArrangementItems(extractInlineArrangementItems(normalized));
  }

  const items: McqArrangementItem[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const end = i + 1 < starts.length ? starts[i + 1]!.labelStart : normalized.length;
    let text = normalized.slice(starts[i]!.contentStart, end).trim();
    text = stripTrailingChoiceBlock(text);
    if (isPermutationChoiceText(text)) {
      break;
    }
    if (text) {
      items.push({ key: starts[i]!.key, text });
    }
  }
  return sanitizeArrangementItems(items);
}

function extractInlineArrangementItems(text: string): McqArrangementItem[] {
  const re = /\s+([a-e])\.\s+/gi;
  const starts: { key: string; labelStart: number; contentStart: number }[] = [];
  let match: RegExpExecArray | null;
  const first = text.match(/^([a-e])\.\s+/i);
  if (first) {
    starts.push({
      key: first[1]!.toLowerCase(),
      labelStart: 0,
      contentStart: first[0].length,
    });
  }
  while ((match = re.exec(text)) !== null) {
    starts.push({
      key: match[1]!.toLowerCase(),
      labelStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }
  if (starts.length < 3) return [];

  const items: McqArrangementItem[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const end = i + 1 < starts.length ? starts[i + 1]!.labelStart : text.length;
    let body = text.slice(starts[i]!.contentStart, end).trim();
    body = stripTrailingChoiceBlock(body);
    if (isPermutationChoiceText(body)) break;
    if (body) items.push({ key: starts[i]!.key, text: body });
  }
  return items;
}

/**
 * Remove glued option lines (`A. d – e – …` or `a. d – e – …`) left after the last sentence.
 */
function stripTrailingChoiceBlock(text: string): string {
  return text
    .replace(/\s*[A-Da-d]\.\s*[a-e](\s*[–\-—,]\s*[a-e]){2,}[\s\S]*$/i, "")
    .trim();
}

export function extractStemBeforeArrangementItems(promptText: string): string {
  const normalized = promptText.replace(/\r\n/g, "\n");
  const cut = normalized.search(/(?:^|[\n\r])\s*[a-e]\.\s+/i);
  if (cut <= 0) {
    const inline = normalized.search(/\s+[a-e]\.\s+/i);
    if (inline > 0) return normalized.slice(0, inline).trim();
    return normalized.trim();
  }
  return normalized.slice(0, cut).trim();
}

export function looksLikeArrangementMcq(
  promptText: string,
  choices: Pick<ExerciseChoice, "text">[],
): boolean {
  if (countPermutationChoices(choices) < 2) return false;
  return extractArrangementItemsFromPrompt(promptText).length >= 3;
}

export type McqArrangementView = {
  isArrangement: boolean;
  stem: string;
  items: McqArrangementItem[];
};

/**
 * Prefer stored `items` / `layout`; else heuristic-split flat prompt for display
 * (legacy AI dumps). Does not mutate the question.
 */
export function resolveMcqArrangementView(question: MultipleChoiceQuestion): McqArrangementView {
  const stored = sanitizeArrangementItems(
    (question.items ?? []).map((item) => ({
      key: String(item.key ?? "").trim().toLowerCase(),
      text: String(item.text ?? "").trim(),
    })),
  );

  if (stored.length >= 3) {
    return {
      isArrangement: true,
      stem: question.prompt.text.trim(),
      items: stored,
    };
  }

  const forceLayout = question.layout === MCQ_LAYOUT_SENTENCE_ARRANGEMENT;
  const heuristic =
    forceLayout || looksLikeArrangementMcq(question.prompt.text, question.choices);
  if (!heuristic) {
    return { isArrangement: false, stem: question.prompt.text.trim(), items: [] };
  }

  const items = extractArrangementItemsFromPrompt(question.prompt.text);
  if (items.length < 3) {
    return { isArrangement: false, stem: question.prompt.text.trim(), items: [] };
  }

  return {
    isArrangement: true,
    stem: extractStemBeforeArrangementItems(question.prompt.text),
    items,
  };
}

/** Persist structured fields when AI/import left a flat prompt. */
export function normalizeMcqArrangementFields(
  question: MultipleChoiceQuestion,
): MultipleChoiceQuestion {
  if ((question.items?.length ?? 0) >= 1) {
    const items = sanitizeArrangementItems(
      question.items!.map((item) => ({
        key: item.key.trim().toLowerCase(),
        text: item.text.trim(),
      })),
    );
    if (items.length >= 3) {
      return {
        ...question,
        layout: question.layout ?? MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
        items,
      };
    }
  }

  if (!looksLikeArrangementMcq(question.prompt.text, question.choices)) {
    return question;
  }

  const items = extractArrangementItemsFromPrompt(question.prompt.text);
  if (items.length < 3) return question;

  return {
    ...question,
    layout: MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
    prompt: {
      ...question.prompt,
      text: extractStemBeforeArrangementItems(question.prompt.text),
    },
    items,
  };
}
