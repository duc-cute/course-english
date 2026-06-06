const KEY_PREFIX = "course-english.exercise.v1";

export type ExerciseSessionSnapshot = {
  lessonId: string;
  blockIds: string[];
  questionIndex: number;
  completed: boolean;
  updatedAt: number;
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
