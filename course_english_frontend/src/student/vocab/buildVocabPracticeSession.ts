import type { VocabularyAudioAccent } from "../../shared/constants/systemConfigKeys";
import type { LessonBlockRecord } from "../../shared/api/lesson";
import {
  generateListenChooseFromVocabItems,
  generateListenTypeFromVocabItems,
  generateMatchingFromVocabItems,
  generateMcqFromVocabItems,
  generateSpellingFromVocabItems,
  type VocabItemInput,
} from "../../shared/lesson/vocabActivityGenerator";
import type { ExerciseQuestion, ExerciseSetPayload } from "../lessonPlayer/exercise/types";

/** MVP ratios from STUDENT_VOCAB_LEARNING_PLAN.md */
export const VOCAB_PRACTICE_RATIOS = {
  MULTIPLE_CHOICE: 0.3,
  MATCHING: 0.25,
  LISTEN_CHOOSE: 0.2,
  SPELLING: 0.15,
  LISTEN_TYPE: 0.1,
} as const;

export const VOCAB_PRACTICE_MAX_QUESTIONS = 16;
export const VOCAB_PRACTICE_PASS_SCORE = 80;

export type VocabPracticeSessionOptions = {
  title?: string;
  passScorePercent?: number;
  maxQuestions?: number;
  audioAccent?: VocabularyAudioAccent;
  sessionKey?: number | string;
};

export type VocabPracticeSessionResult = {
  payload: ExerciseSetPayload;
  practiceBlocks: LessonBlockRecord[];
  sessionId: string;
  warnings: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function allocateCounts(total: number): Record<keyof typeof VOCAB_PRACTICE_RATIOS, number> {
  const keys = Object.keys(VOCAB_PRACTICE_RATIOS) as (keyof typeof VOCAB_PRACTICE_RATIOS)[];
  const raw = keys.map((k) => ({
    key: k,
    value: total * VOCAB_PRACTICE_RATIOS[k],
  }));
  const floors = raw.map((r) => ({
    key: r.key,
    n: Math.floor(r.value),
    frac: r.value - Math.floor(r.value),
  }));
  let remain = total - floors.reduce((s, f) => s + f.n, 0);
  floors.sort((a, b) => b.frac - a.frac);
  const counts = {} as Record<keyof typeof VOCAB_PRACTICE_RATIOS, number>;
  for (const f of floors) counts[f.key] = f.n;
  for (let i = 0; i < floors.length && remain > 0; i += 1) {
    counts[floors[i].key] += 1;
    remain -= 1;
  }
  return counts;
}

function pickQuestions(questions: ExerciseQuestion[], n: number): ExerciseQuestion[] {
  if (n <= 0 || questions.length === 0) return [];
  return shuffle(questions).slice(0, Math.min(n, questions.length));
}

/**
 * Mixed vocab practice session → synthetic EXERCISE_SET block for ExercisePlayer.
 */
export function buildVocabPracticeSession(
  items: VocabItemInput[],
  options: VocabPracticeSessionOptions = {},
): VocabPracticeSessionResult {
  const warnings: string[] = [];
  const eligible = items.filter((i) => i.wordEn.trim() && i.meaningVi.trim());
  const passScorePercent = options.passScorePercent ?? VOCAB_PRACTICE_PASS_SCORE;
  const maxQuestions = options.maxQuestions ?? VOCAB_PRACTICE_MAX_QUESTIONS;
  const audioAccent = options.audioAccent ?? "UK";
  const title = options.title ?? "Luyện tập từ vựng";
  const sessionId = `vocab-practice-${options.sessionKey ?? Date.now()}`;

  const empty = (msg: string): VocabPracticeSessionResult => {
    const payload: ExerciseSetPayload = {
      title,
      instruction: msg,
      presentation: "stepped",
      shuffleQuestions: false,
      shuffleOptions: true,
      passScorePercent,
      questions: [],
    };
    return { payload, practiceBlocks: [], sessionId, warnings: [msg] };
  };

  if (eligible.length === 0) {
    return empty("Bộ từ không có mục hợp lệ.");
  }

  const questionCount = Math.min(Math.max(eligible.length, 1), maxQuestions);
  const counts = allocateCounts(questionCount);
  const hasAudio = eligible.some((i) => Boolean(i.audioUkUrl?.trim() || i.audioUsUrl?.trim()));

  if (!hasAudio) {
    counts.SPELLING += counts.LISTEN_CHOOSE + counts.LISTEN_TYPE;
    counts.LISTEN_CHOOSE = 0;
    counts.LISTEN_TYPE = 0;
    warnings.push("Bộ từ chưa có audio — phần nghe đã chuyển sang chính tả.");
  }

  if (eligible.length < 4) {
    counts.SPELLING += counts.MULTIPLE_CHOICE;
    counts.MULTIPLE_CHOICE = 0;
    warnings.push("Bộ từ dưới 4 mục — bỏ trắc nghiệm (cần đáp án nhiễu).");
  }

  if (eligible.length < 2) {
    counts.SPELLING += counts.MATCHING;
    counts.MATCHING = 0;
  }

  const collected: ExerciseQuestion[] = [];

  if (counts.MULTIPLE_CHOICE > 0) {
    try {
      const r = generateMcqFromVocabItems(eligible, {
        shuffleQuestions: true,
        shuffleOptions: true,
        passScorePercent,
      });
      collected.push(...pickQuestions(r.payload.questions, counts.MULTIPLE_CHOICE));
      warnings.push(...r.warnings);
    } catch {
      counts.SPELLING += counts.MULTIPLE_CHOICE;
    }
  }

  if (counts.MATCHING > 0) {
    try {
      const r = generateMatchingFromVocabItems(eligible, {
        passScorePercent,
        pairsPerQuestion: 8,
      });
      collected.push(...pickQuestions(r.payload.questions, counts.MATCHING));
      warnings.push(...r.warnings);
    } catch {
      counts.SPELLING += counts.MATCHING;
    }
  }

  if (counts.LISTEN_CHOOSE > 0) {
    try {
      const r = generateListenChooseFromVocabItems(eligible, {
        shuffleQuestions: true,
        shuffleOptions: true,
        passScorePercent,
        audioAccent,
      });
      collected.push(...pickQuestions(r.payload.questions, counts.LISTEN_CHOOSE));
      warnings.push(...r.warnings);
    } catch {
      counts.SPELLING += counts.LISTEN_CHOOSE;
    }
  }

  if (counts.LISTEN_TYPE > 0) {
    try {
      const r = generateListenTypeFromVocabItems(eligible, {
        shuffleQuestions: true,
        passScorePercent,
        audioAccent,
      });
      collected.push(...pickQuestions(r.payload.questions, counts.LISTEN_TYPE));
      warnings.push(...r.warnings);
    } catch {
      counts.SPELLING += counts.LISTEN_TYPE;
    }
  }

  const spellingNeeded = Math.max(
    counts.SPELLING,
    questionCount - collected.length,
  );
  if (spellingNeeded > 0) {
    try {
      const r = generateSpellingFromVocabItems(eligible, {
        shuffleQuestions: true,
        passScorePercent,
        includeHint: true,
      });
      collected.push(...pickQuestions(r.payload.questions, spellingNeeded));
      warnings.push(...r.warnings);
    } catch {
      /* ignore */
    }
  }

  const finalQuestions = shuffle(collected).slice(0, questionCount);
  if (finalQuestions.length === 0) {
    return empty("Không tạo được câu luyện tập từ bộ từ này.");
  }

  const payload: ExerciseSetPayload = {
    title,
    instruction: "Trả lời các câu hỏi từ vựng (trắc nghiệm, ghép cặp, nghe, chính tả…)",
    presentation: "stepped",
    shuffleQuestions: false,
    shuffleOptions: true,
    passScorePercent,
    questions: finalQuestions,
  };

  const practiceBlocks: LessonBlockRecord[] = [
    {
      id: sessionId,
      blockType: "EXERCISE_SET",
      displayOrder: 0,
      payloadJson: JSON.stringify(payload),
    },
  ];

  return { payload, practiceBlocks, sessionId, warnings };
}
