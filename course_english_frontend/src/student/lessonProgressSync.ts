import { getAccessToken } from "../shared/auth/token";
import {
  apiGetContinueReadingProgress,
  apiGetLessonReadingProgress,
  apiUpsertLessonReadingProgress,
  type LessonReadingProgressRecord,
} from "../shared/api/lessonReadingProgress";
import type { LessonPlayerTab } from "../shared/lesson/blockTypes";
import {
  getContinueLearning,
  getLessonProgress,
  saveLessonProgress,
  type LessonProgressEntry,
} from "./lessonProgressStorage";

const SERVER_SYNC_DEBOUNCE_MS = 800;
const syncTimers = new Map<string, number>();

function normalizeTab(tab?: string): LessonPlayerTab {
  return tab === "practice" ? "practice" : "study";
}

function recordToEntry(row: LessonReadingProgressRecord): LessonProgressEntry {
  return {
    lessonId: row.lessonId,
    lessonTitle: row.lessonTitle ?? "Bài học",
    subjectName: row.subjectName,
    lastBlockId: row.lastBlockId ?? "",
    scrollPercent: row.scrollPercent ?? 0,
    lastTab: normalizeTab(row.lastTab),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

function isNewer(a?: string, b?: string): boolean {
  if (!a) return false;
  if (!b) return true;
  return new Date(a).getTime() > new Date(b).getTime();
}

function scheduleServerSync(entry: LessonProgressEntry) {
  if (!getAccessToken()) return;

  const existing = syncTimers.get(entry.lessonId);
  if (existing) window.clearTimeout(existing);

  const timer = window.setTimeout(() => {
    syncTimers.delete(entry.lessonId);
    void apiUpsertLessonReadingProgress(entry.lessonId, {
      lastBlockId: entry.lastBlockId || undefined,
      scrollPercent: Math.round(entry.scrollPercent),
      lastTab: entry.lastTab ?? "study",
      lessonTitle: entry.lessonTitle,
      subjectName: entry.subjectName,
    }).catch(() => {
      /* offline / guest — giữ local */
    });
  }, SERVER_SYNC_DEBOUNCE_MS);

  syncTimers.set(entry.lessonId, timer);
}

/** Lưu local ngay + đồng bộ server (debounce) khi đã đăng nhập. */
export function syncLessonProgress(entry: Omit<LessonProgressEntry, "updatedAt">) {
  saveLessonProgress(entry);
  const saved = getLessonProgress(entry.lessonId);
  if (saved) scheduleServerSync(saved);
}

export async function hydrateLessonProgressForLesson(
  lessonId: string,
): Promise<LessonProgressEntry | null> {
  const local = getLessonProgress(lessonId);
  if (!getAccessToken()) return local;

  const server = await apiGetLessonReadingProgress(lessonId);
  if (!server) return local;

  const serverEntry = recordToEntry(server);
  if (!local || isNewer(serverEntry.updatedAt, local.updatedAt)) {
    saveLessonProgress(serverEntry);
    return serverEntry;
  }
  return local;
}

export async function resolveContinueLearning(): Promise<LessonProgressEntry | null> {
  const local = getContinueLearning();
  if (!getAccessToken()) return local;

  const server = await apiGetContinueReadingProgress();
  if (!server) return local;

  const serverEntry = recordToEntry(server);
  if (!local) {
    saveLessonProgress(serverEntry);
    return serverEntry;
  }

  if (isNewer(serverEntry.updatedAt, local.updatedAt)) {
    saveLessonProgress(serverEntry);
    return serverEntry;
  }
  return local;
}
