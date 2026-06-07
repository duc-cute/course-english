import type { ExerciseSetPayload, MultipleChoiceQuestion } from "../../student/lessonPlayer/exercise/types";

export type VocabItemInput = {
  id?: string;
  wordEn: string;
  meaningVi: string;
};

export type McqGenerationOptions = {
  title?: string;
  instruction?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScorePercent?: number;
};

export type McqGenerationResult = {
  payload: ExerciseSetPayload;
  warnings: string[];
};

const CHOICE_IDS = ["a", "b", "c", "d"] as const;
const MIN_ITEMS_FOR_MCQ = 4;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function validateVocabSetForMcq(items: VocabItemInput[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (items.length < MIN_ITEMS_FOR_MCQ) {
    errors.push(`Cần ít nhất ${MIN_ITEMS_FOR_MCQ} từ để sinh MCQ (mỗi câu cần 3 đáp án nhiễu).`);
  }

  const words = new Set<string>();
  const meanings = new Set<string>();
  for (const item of items) {
    if (!item.wordEn.trim() || !item.meaningVi.trim()) {
      errors.push("Mỗi dòng cần đủ word_en và meaning_vi.");
      break;
    }
    words.add(normalizeWord(item.wordEn));
    meanings.add(item.meaningVi.trim().toLowerCase());
  }

  if (meanings.size < items.length) {
    errors.push("Có nghĩa tiếng Việt trùng nhau — MCQ có thể có nhiều đáp án đúng.");
  }

  return { valid: errors.length === 0, errors };
}

function createMcqForItem(item: VocabItemInput, allItems: VocabItemInput[], index: number): MultipleChoiceQuestion {
  const distractors = shuffle(allItems.filter((x) => normalizeWord(x.wordEn) !== normalizeWord(item.wordEn)))
    .slice(0, 3)
    .map((x) => x.meaningVi.trim());

  const choiceTexts = shuffle([item.meaningVi.trim(), ...distractors]);
  const correctIdx = choiceTexts.indexOf(item.meaningVi.trim());
  const choices = choiceTexts.map((text, i) => ({
    id: CHOICE_IDS[i],
    text,
  }));

  return {
    id: item.id ? `vocab-${item.id}` : `vocab-q${index + 1}`,
    type: "MULTIPLE_CHOICE",
    prompt: { text: item.wordEn.trim(), lang: "en" },
    choices,
    correctChoiceId: CHOICE_IDS[correctIdx],
    explanation: `${item.wordEn.trim()} = ${item.meaningVi.trim()}.`,
  };
}

export function generateMcqFromVocabItems(
  items: VocabItemInput[],
  options: McqGenerationOptions = {},
): McqGenerationResult {
  const validation = validateVocabSetForMcq(items);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const warnings: string[] = [];
  const normalizedItems = items.map((item) => ({
    ...item,
    wordEn: item.wordEn.trim(),
    meaningVi: item.meaningVi.trim(),
  }));

  const questions = normalizedItems.map((item, index) => createMcqForItem(item, normalizedItems, index));
  const shuffledQuestions = options.shuffleQuestions ? shuffle(questions) : questions;

  const payload: ExerciseSetPayload = {
    title: options.title ?? "Bài tập từ vựng",
    instruction: options.instruction ?? "Chọn nghĩa tiếng Việt đúng",
    presentation: "stepped",
    shuffleQuestions: options.shuffleQuestions ?? false,
    shuffleOptions: options.shuffleOptions ?? true,
    passScorePercent: options.passScorePercent ?? 80,
    questions: shuffledQuestions,
  };

  if (items.length < 6) {
    warnings.push("Bộ từ ít — đáp án nhiễu sẽ lặp lại giữa các câu.");
  }

  return { payload, warnings };
}
