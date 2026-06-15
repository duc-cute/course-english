import type { LessonBlockRecord, LessonBlockType } from "../api/lesson";

/** Tab trên Lesson Player */
export type LessonPlayerTab = "study" | "practice";

/** Block hiển thị tab Bài học (nội dung / dạy) */
export const STUDY_BLOCK_TYPES: ReadonlySet<LessonBlockType> = new Set([
  "TEXT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "CALLOUT",
  "SUMMARY",
  "VOCABULARY",
  "SLIDE_DECK",
]);

/** Block hiển thị tab Bài tập (tương tác / chấm điểm) */
export const PRACTICE_BLOCK_TYPES: ReadonlySet<LessonBlockType> = new Set([
  "EXERCISE_SET",
  "QUESTION_REF",
]);

export function isStudyBlockType(type: LessonBlockType | string): boolean {
  return STUDY_BLOCK_TYPES.has(type as LessonBlockType);
}

export function isPracticeBlockType(type: LessonBlockType | string): boolean {
  return PRACTICE_BLOCK_TYPES.has(type as LessonBlockType);
}

export function filterBlocksForTab(
  blocks: LessonBlockRecord[],
  tab: LessonPlayerTab,
): LessonBlockRecord[] {
  const sorted = [...blocks].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  if (tab === "study") {
    return sorted.filter((b) => isStudyBlockType(b.blockType));
  }
  return sorted.filter((b) => isPracticeBlockType(b.blockType));
}

export function lessonHasStudyTab(blocks: LessonBlockRecord[]): boolean {
  return blocks.some((b) => isStudyBlockType(b.blockType));
}

export function lessonHasPracticeTab(blocks: LessonBlockRecord[]): boolean {
  return blocks.some((b) => isPracticeBlockType(b.blockType));
}

export function defaultLessonPlayerTab(blocks: LessonBlockRecord[]): LessonPlayerTab {
  if (lessonHasPracticeTab(blocks) && !lessonHasStudyTab(blocks)) {
    return "practice";
  }
  return "study";
}
