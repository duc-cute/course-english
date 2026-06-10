import type { VocabularyAudioAccent } from "../constants/systemConfigKeys";
import type {
  ExerciseSetPayload,
  ListenChooseQuestion,
  ListenTypeQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  SpellingQuestion,
} from "../../student/lessonPlayer/exercise/types";
import { buildSpellingHint } from "./answerNormalize";

export type VocabItemInput = {
  id?: string;
  wordEn: string;
  meaningVi: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
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

export type MatchingGenerationOptions = {
  title?: string;
  instruction?: string;
  passScorePercent?: number;
  /** Chia thành nhiều câu ghép cặp nếu bộ từ lớn (mặc định 8 cặp/câu) */
  pairsPerQuestion?: number;
};

export type MatchingGenerationResult = {
  payload: ExerciseSetPayload;
  warnings: string[];
};

export type ListenChooseGenerationOptions = {
  title?: string;
  instruction?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScorePercent?: number;
  /** Giọng audio snapshot — mặc định UK */
  audioAccent?: VocabularyAudioAccent;
};

export type ListenChooseGenerationResult = {
  payload: ExerciseSetPayload;
  warnings: string[];
};

export type SpellingGenerationOptions = {
  title?: string;
  instruction?: string;
  shuffleQuestions?: boolean;
  passScorePercent?: number;
  includeHint?: boolean;
};

export type SpellingGenerationResult = {
  payload: ExerciseSetPayload;
  warnings: string[];
};

export type ListenTypeGenerationOptions = {
  title?: string;
  instruction?: string;
  shuffleQuestions?: boolean;
  passScorePercent?: number;
  audioAccent?: VocabularyAudioAccent;
};

export type ListenTypeGenerationResult = {
  payload: ExerciseSetPayload;
  warnings: string[];
};

const CHOICE_IDS = ["a", "b", "c", "d"] as const;
const MIN_ITEMS_FOR_MCQ = 4;
const MIN_ITEMS_FOR_MATCHING = 2;
const MIN_ITEMS_FOR_LISTEN = 4;
const MIN_ITEMS_FOR_SPELLING = 1;
const MIN_ITEMS_FOR_LISTEN_TYPE = 1;
const DEFAULT_PAIRS_PER_QUESTION = 8;

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

export function validateVocabSetForMatching(items: VocabItemInput[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (items.length < MIN_ITEMS_FOR_MATCHING) {
    errors.push(`Cần ít nhất ${MIN_ITEMS_FOR_MATCHING} từ để sinh bài ghép cặp.`);
  }

  const words = new Set<string>();
  for (const item of items) {
    if (!item.wordEn.trim() || !item.meaningVi.trim()) {
      errors.push("Mỗi dòng cần đủ word_en và meaning_vi.");
      break;
    }
    const key = normalizeWord(item.wordEn);
    if (words.has(key)) {
      errors.push("Có từ tiếng Anh trùng nhau — không thể ghép cặp.");
      break;
    }
    words.add(key);
  }

  return { valid: errors.length === 0, errors };
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function createMatchingQuestionFromItems(
  chunk: VocabItemInput[],
  index: number,
  setTitle: string,
): MatchingQuestion {
  return {
    id: `vocab-matching-${index + 1}`,
    type: "MATCHING",
    prompt: {
      text: chunk.length < 8 ? "Ghép từ tiếng Anh với nghĩa tiếng Việt" : `${setTitle} — phần ${index + 1}`,
      lang: "vi",
    },
    pairs: chunk.map((item) => ({
      left: item.wordEn.trim(),
      right: item.meaningVi.trim(),
    })),
    explanation: "Ghép đúng từ tiếng Anh với nghĩa tiếng Việt tương ứng.",
  };
}

export function generateMatchingFromVocabItems(
  items: VocabItemInput[],
  options: MatchingGenerationOptions = {},
): MatchingGenerationResult {
  const validation = validateVocabSetForMatching(items);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const warnings: string[] = [];
  const normalizedItems = items.map((item) => ({
    ...item,
    wordEn: item.wordEn.trim(),
    meaningVi: item.meaningVi.trim(),
  }));

  const pairsPerQuestion = options.pairsPerQuestion ?? DEFAULT_PAIRS_PER_QUESTION;
  const chunks = chunkItems(normalizedItems, pairsPerQuestion);
  const setTitle = options.title?.replace(/\s*—\s*Ghép cặp$/i, "") ?? "Bộ từ";
  const questions = chunks.map((chunk, index) => createMatchingQuestionFromItems(chunk, index, setTitle));

  const payload: ExerciseSetPayload = {
    title: options.title ?? "Bài tập ghép cặp",
    instruction: options.instruction ?? "Ghép từ tiếng Anh với nghĩa tiếng Việt",
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent: options.passScorePercent ?? 80,
    questions,
  };

  if (chunks.length > 1) {
    warnings.push(`Bộ từ ${items.length} mục — chia thành ${chunks.length} câu ghép cặp.`);
  }

  return { payload, warnings };
}

function pickAudioForItem(
  item: VocabItemInput,
  accent: VocabularyAudioAccent,
): { url: string; accent: "UK" | "US" } | null {
  const uk = item.audioUkUrl?.trim();
  const us = item.audioUsUrl?.trim();
  if (accent === "UK") {
    return uk ? { url: uk, accent: "UK" } : null;
  }
  if (accent === "US") {
    return us ? { url: us, accent: "US" } : null;
  }
  if (uk) return { url: uk, accent: "UK" };
  if (us) return { url: us, accent: "US" };
  return null;
}

export function validateVocabSetForListenChoose(
  items: VocabItemInput[],
  audioAccent: VocabularyAudioAccent = "UK",
): { valid: boolean; errors: string[]; eligible: VocabItemInput[] } {
  const errors: string[] = [];
  const eligible = items.filter((item) => {
    if (!item.wordEn.trim() || !item.meaningVi.trim()) return false;
    return pickAudioForItem(item, audioAccent) !== null;
  });

  if (eligible.length < MIN_ITEMS_FOR_LISTEN) {
    const accentLabel = audioAccent === "US" ? "US" : audioAccent === "BOTH" ? "UK hoặc US" : "UK";
    errors.push(
      `Cần ít nhất ${MIN_ITEMS_FOR_LISTEN} từ có audio ${accentLabel} (đã enrich). Hiện có ${eligible.length} từ.`,
    );
  }

  const meanings = new Set<string>();
  for (const item of eligible) {
    meanings.add(item.meaningVi.trim().toLowerCase());
  }
  if (meanings.size < eligible.length) {
    errors.push("Có nghĩa tiếng Việt trùng nhau — bài nghe có thể có nhiều đáp án đúng.");
  }

  return { valid: errors.length === 0, errors, eligible };
}

function createListenChooseForItem(
  item: VocabItemInput,
  allItems: VocabItemInput[],
  index: number,
  audioAccent: VocabularyAudioAccent,
): ListenChooseQuestion | null {
  const audio = pickAudioForItem(item, audioAccent);
  if (!audio) return null;

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
    id: item.id ? `vocab-listen-${item.id}` : `vocab-listen-q${index + 1}`,
    type: "LISTEN_CHOOSE",
    audioUrl: audio.url,
    audioAccent: audio.accent,
    wordEn: item.wordEn.trim(),
    prompt: { text: "Nghe và chọn nghĩa tiếng Việt đúng", lang: "vi" },
    choices,
    correctChoiceId: CHOICE_IDS[correctIdx],
    explanation: `${item.wordEn.trim()} = ${item.meaningVi.trim()}.`,
  };
}

export function generateListenChooseFromVocabItems(
  items: VocabItemInput[],
  options: ListenChooseGenerationOptions = {},
): ListenChooseGenerationResult {
  const audioAccent = options.audioAccent ?? "UK";
  const validation = validateVocabSetForListenChoose(items, audioAccent);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const warnings: string[] = [];
  const skipped = items.length - validation.eligible.length;
  if (skipped > 0) {
    warnings.push(`${skipped} từ không có audio phù hợp — đã bỏ qua khi sinh bài nghe.`);
  }

  const normalizedItems = validation.eligible.map((item) => ({
    ...item,
    wordEn: item.wordEn.trim(),
    meaningVi: item.meaningVi.trim(),
  }));

  const questions = normalizedItems
    .map((item, index) => createListenChooseForItem(item, normalizedItems, index, audioAccent))
    .filter((q): q is ListenChooseQuestion => q !== null);

  const shuffledQuestions = options.shuffleQuestions ? shuffle(questions) : questions;

  const payload: ExerciseSetPayload = {
    title: options.title ?? "Bài nghe — chọn nghĩa",
    instruction: options.instruction ?? "Nghe phát âm và chọn nghĩa tiếng Việt đúng",
    presentation: "stepped",
    shuffleQuestions: options.shuffleQuestions ?? false,
    shuffleOptions: options.shuffleOptions ?? true,
    passScorePercent: options.passScorePercent ?? 80,
    questions: shuffledQuestions,
  };

  if (normalizedItems.length < 6) {
    warnings.push("Bộ từ ít — đáp án nhiễu sẽ lặp lại giữa các câu.");
  }

  return { payload, warnings };
}

export function validateVocabSetForSpelling(
  items: VocabItemInput[],
): { valid: boolean; errors: string[]; eligible: VocabItemInput[] } {
  const errors: string[] = [];
  const eligible = items.filter((item) => item.wordEn.trim() && item.meaningVi.trim());

  if (eligible.length < MIN_ITEMS_FOR_SPELLING) {
    errors.push(
      `Cần ít nhất ${MIN_ITEMS_FOR_SPELLING} từ hợp lệ (word + nghĩa). Hiện có ${eligible.length} từ.`,
    );
  }

  return { valid: errors.length === 0, errors, eligible };
}

export function generateSpellingFromVocabItems(
  items: VocabItemInput[],
  options: SpellingGenerationOptions = {},
): SpellingGenerationResult {
  const validation = validateVocabSetForSpelling(items);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const warnings: string[] = [];
  const includeHint = options.includeHint !== false;

  const questions: SpellingQuestion[] = validation.eligible.map((item, index) => {
    const wordEn = item.wordEn.trim();
    const meaningVi = item.meaningVi.trim();
    return {
      id: item.id ? `vocab-spell-${item.id}` : `vocab-spell-q${index + 1}`,
      type: "SPELLING",
      prompt: { text: meaningVi, lang: "vi" },
      correctAnswer: wordEn,
      wordEn,
      hint: includeHint ? buildSpellingHint(wordEn) : undefined,
      caseSensitive: false,
      explanation: `${wordEn} = ${meaningVi}.`,
    };
  });

  const shuffledQuestions = options.shuffleQuestions ? shuffle(questions) : questions;

  const payload: ExerciseSetPayload = {
    title: options.title ?? "Bài gõ chính tả",
    instruction: options.instruction ?? "Nhìn nghĩa tiếng Việt và gõ từ tiếng Anh",
    presentation: "stepped",
    shuffleQuestions: options.shuffleQuestions ?? false,
    shuffleOptions: false,
    passScorePercent: options.passScorePercent ?? 80,
    questions: shuffledQuestions,
  };

  return { payload, warnings };
}

export function validateVocabSetForListenType(
  items: VocabItemInput[],
  audioAccent: VocabularyAudioAccent = "UK",
): { valid: boolean; errors: string[]; eligible: VocabItemInput[] } {
  const errors: string[] = [];
  const eligible = items.filter((item) => {
    if (!item.wordEn.trim()) return false;
    return pickAudioForItem(item, audioAccent) !== null;
  });

  if (eligible.length < MIN_ITEMS_FOR_LISTEN_TYPE) {
    const accentLabel = audioAccent === "US" ? "US" : audioAccent === "BOTH" ? "UK hoặc US" : "UK";
    errors.push(
      `Cần ít nhất ${MIN_ITEMS_FOR_LISTEN_TYPE} từ có audio ${accentLabel} (đã enrich). Hiện có ${eligible.length} từ.`,
    );
  }

  return { valid: errors.length === 0, errors, eligible };
}

function createListenTypeForItem(
  item: VocabItemInput,
  index: number,
  audioAccent: VocabularyAudioAccent,
): ListenTypeQuestion | null {
  const audio = pickAudioForItem(item, audioAccent);
  if (!audio) return null;

  const wordEn = item.wordEn.trim();
  const meaningVi = item.meaningVi.trim();

  return {
    id: item.id ? `vocab-listen-type-${item.id}` : `vocab-listen-type-q${index + 1}`,
    type: "LISTEN_TYPE",
    audioUrl: audio.url,
    audioAccent: audio.accent,
    correctAnswer: wordEn,
    wordEn,
    prompt: { text: "Nghe và gõ từ tiếng Anh", lang: "vi" },
    caseSensitive: false,
    explanation: meaningVi ? `${wordEn} = ${meaningVi}.` : undefined,
  };
}

export function generateListenTypeFromVocabItems(
  items: VocabItemInput[],
  options: ListenTypeGenerationOptions = {},
): ListenTypeGenerationResult {
  const audioAccent = options.audioAccent ?? "UK";
  const validation = validateVocabSetForListenType(items, audioAccent);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const warnings: string[] = [];
  const skipped = items.length - validation.eligible.length;
  if (skipped > 0) {
    warnings.push(`${skipped} từ không có audio phù hợp — đã bỏ qua.`);
  }

  const questions = validation.eligible
    .map((item, index) => createListenTypeForItem(item, index, audioAccent))
    .filter((q): q is ListenTypeQuestion => q !== null);

  const shuffledQuestions = options.shuffleQuestions ? shuffle(questions) : questions;

  const payload: ExerciseSetPayload = {
    title: options.title ?? "Bài nghe — gõ từ",
    instruction: options.instruction ?? "Nghe phát âm và gõ từ tiếng Anh",
    presentation: "stepped",
    shuffleQuestions: options.shuffleQuestions ?? false,
    shuffleOptions: false,
    passScorePercent: options.passScorePercent ?? 80,
    questions: shuffledQuestions,
  };

  return { payload, warnings };
}

