const KEY_PREFIX = "course-english.exercise.v1";

export type ExerciseAnswerSnapshot = {
  correct: boolean;
  selectedChoiceId?: string;
  /** left → right (MATCHING) */
  matchingSelections?: Record<string, string>;
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
