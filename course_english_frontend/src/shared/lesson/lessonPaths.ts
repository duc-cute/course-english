import type { LessonPlayerTab } from "./blockTypes";
import { paths } from "../constants/paths";

type LessonPathTarget = {
  slug?: string;
  id?: string;
};

export function studentLessonPath(
  lesson: LessonPathTarget,
  options?: { tab?: LessonPlayerTab },
): string {
  const segment = lesson.slug || lesson.id || "";
  const base = `/${paths.STUDENT}/${paths.STUDENT_LESSONS}/${segment}`;
  if (options?.tab) {
    return `${base}?tab=${options.tab}`;
  }
  return base;
}
