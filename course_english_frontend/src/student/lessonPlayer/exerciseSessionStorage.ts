const KEY_PREFIX = "course-english.exercise.v1";

export type ExerciseAnswerSnapshot = {
  correct: boolean;
  selectedChoiceId?: string;
  /** Gõ chữ — SPELLING / LISTEN_TYPE */
  typedAnswer?: string;
  /** blankId → answer (FILL_BLANK) */
  fillBlankAnswers?: Record<string, string>;
  /** blankId → choiceId (GAP_FILL_MCQ) */
  gapFillMcqAnswers?: Record<string, string>;
  /** subQuestionId → choiceId (READING_COMPREHENSION) */
  readingSubAnswers?: Record<string, string>;
  /** Chấm từng ô — GAP_FILL_MCQ */
  correctBlankCount?: number;
  totalBlanks?: number;
  /** Chấm từng câu con — READING_COMPREHENSION */
  correctSubCount?: number;
  totalSubQuestions?: number;
  /** left → right (MATCHING) */
  matchingSelections?: Record<string, string>;
  /** token ids đã xếp (REORDER_SENTENCE) */
  reorderTokenOrder?: string[];
};

export type ExerciseSessionSnapshot = {
  lessonId: string;
  blockIds: string[];
  questionIndex: number;
  completed: boolean;
  updatedAt?: number;
  /** Thứ tự câu sau shuffle — giữ ổn định khi F5 */
  questionIdsOrder?: string[];
  /** questionId → thứ tự choice id sau shuffle */
  choiceOrders?: Record<string, string[]>;
  answers?: Record<string, ExerciseAnswerSnapshot>;
  startedAt?: number;
  elapsedMs?: number;
  /** Đã POST attempt lên server — tránh gửi trùng khi F5 màn kết quả */
  serverAttemptSynced?: boolean;
  /** Exam take: question ids marked for review */
  flaggedQuestionIds?: string[];
  /** Exam take: flat unit index (blank/sub as câu) */
  examUnitIndex?: number;
};

function storageKey(lessonId: string): string {
  return `${KEY_PREFIX}.${lessonId}`;
}

export function getExerciseSession(lessonId: string): ExerciseSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey(lessonId));
    if (!raw) return null;
    return JSON.parse(raw) as ExerciseSessionSnapshot;
  } catch {
    return null;
  }
}

export function saveExerciseSession(snapshot: ExerciseSessionSnapshot): void {
  try {
    localStorage.setItem(storageKey(snapshot.lessonId), JSON.stringify({ ...snapshot, updatedAt: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

export function clearExerciseSession(lessonId: string): void {
  try {
    localStorage.removeItem(storageKey(lessonId));
  } catch {
    /* ignore */
  }
}
