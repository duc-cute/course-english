const STORAGE_KEY = "course-english.lessonProgress.v1";

export type LessonProgressEntry = {
  lessonId: string;
  lessonTitle: string;
  subjectName?: string;
  lastBlockId: string;
  scrollPercent: number;
  updatedAt: string;
};

type LessonProgressStore = {
  lastActiveLessonId?: string;
  lessons: Record<string, LessonProgressEntry>;
};

function readStore(): LessonProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lessons: {} };
    const parsed = JSON.parse(raw) as LessonProgressStore;
    return parsed?.lessons ? parsed : { lessons: {} };
  } catch {
    return { lessons: {} };
  }
}

function writeStore(store: LessonProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveLessonProgress(entry: Omit<LessonProgressEntry, "updatedAt">) {
  const store = readStore();
  const next: LessonProgressEntry = { ...entry, updatedAt: new Date().toISOString() };
  store.lessons[entry.lessonId] = next;
  store.lastActiveLessonId = entry.lessonId;
  writeStore(store);
}

export function getLessonProgress(lessonId: string): LessonProgressEntry | null {
  return readStore().lessons[lessonId] ?? null;
}

export function getContinueLearning(): LessonProgressEntry | null {
  const store = readStore();
  if (!store.lastActiveLessonId) return null;
  return store.lessons[store.lastActiveLessonId] ?? null;
}
