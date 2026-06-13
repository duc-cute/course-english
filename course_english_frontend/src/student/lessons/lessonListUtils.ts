import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import { isPracticePassed } from "../../shared/api/lessonPracticeAttempt";
import type { LessonRecord } from "../../shared/api/lesson";
import type { LessonProgressEntry } from "../lessonProgressStorage";

export type LessonCardMeta = {
  readPct: number;
  readDone: boolean;
  readInProgress: boolean;
  practicePassed: boolean;
  latestScoreLabel: string | null;
};

export function getLessonCardMeta(
  lessonId: string,
  localProgress: Record<string, LessonProgressEntry>,
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
): LessonCardMeta {
  const readPct = Math.round(localProgress[lessonId]?.scrollPercent ?? 0);
  const readDone = readPct >= 98;
  const readInProgress = readPct > 2 && !readDone;
  const summaryItem = practiceSummary[lessonId];
  const practicePassed = isPracticePassed(summaryItem?.best);
  const latest = summaryItem?.latest;
  const latestScoreLabel =
    !practicePassed && latest ? `Bài tập ${latest.scorePercent}%` : null;

  return { readPct, readDone, readInProgress, practicePassed, latestScoreLabel };
}

export function isLessonCompleted(meta: LessonCardMeta): boolean {
  return meta.readDone || meta.practicePassed;
}

export type SubjectLessonGroup = {
  key: string;
  subjectName: string;
  lessons: LessonRecord[];
};

export function groupLessonsBySubject(lessons: LessonRecord[]): SubjectLessonGroup[] {
  const map = new Map<string, SubjectLessonGroup>();

  for (const lesson of lessons) {
    const key = lesson.subjectId ?? lesson.subjectName ?? "general";
    const subjectName = lesson.subjectName?.trim() || "Bài học chung";
    const existing = map.get(key);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      map.set(key, { key, subjectName, lessons: [lesson] });
    }
  }

  const groups = Array.from(map.values());
  for (const group of groups) {
    group.lessons.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }

  groups.sort((a, b) => (a.lessons[0]?.displayOrder ?? 0) - (b.lessons[0]?.displayOrder ?? 0));
  return groups;
}

export type PathNodeState = "completed" | "active" | "locked";

export type PathLessonNode = {
  lesson: LessonRecord;
  meta: LessonCardMeta;
  state: PathNodeState;
  offsetPx: number;
};

const PATH_OFFSETS = [0, 72, 36, -56, -88, 48, -32, 64] as const;

export function buildPathNodes(
  lessons: LessonRecord[],
  localProgress: Record<string, LessonProgressEntry>,
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
): PathLessonNode[] {
  const metas = lessons.map((lesson) => ({
    lesson,
    meta: getLessonCardMeta(lesson.id, localProgress, practiceSummary),
  }));

  let activeIndex = metas.findIndex((row) => !isLessonCompleted(row.meta));
  if (activeIndex < 0) activeIndex = Math.max(0, metas.length - 1);

  return metas.map((row, index) => {
    let state: PathNodeState;
    if (isLessonCompleted(row.meta)) {
      state = "completed";
    } else if (index === activeIndex) {
      state = "active";
    } else {
      state = "locked";
    }

    return {
      ...row,
      state,
      offsetPx: PATH_OFFSETS[index % PATH_OFFSETS.length],
    };
  });
}

export function countCompletedLessons(nodes: PathLessonNode[]): number {
  return nodes.filter((n) => n.state === "completed").length;
}
