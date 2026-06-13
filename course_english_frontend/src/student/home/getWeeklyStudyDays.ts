import { getAllLessonProgress } from "../lessonProgressStorage";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export type WeeklyStudyDay = {
  label: (typeof WEEKDAY_LABELS)[number];
  active: boolean;
  isToday: boolean;
};

function mondayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date);
  const offset = mondayIndex(copy);
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Which weekdays (Mon–Sun) had lesson activity in the current calendar week. */
export function getWeeklyStudyDays(reference = new Date()): WeeklyStudyDay[] {
  const weekStart = startOfWeekMonday(reference).getTime();
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  const activeDays = new Set<number>();

  for (const entry of Object.values(getAllLessonProgress())) {
    const ts = new Date(entry.updatedAt).getTime();
    if (ts < weekStart || ts >= weekEnd) continue;
    activeDays.add(mondayIndex(new Date(entry.updatedAt)));
  }

  const todayIndex = mondayIndex(reference);

  return WEEKDAY_LABELS.map((label, index) => ({
    label,
    active: activeDays.has(index),
    isToday: index === todayIndex,
  }));
}

export function countWeeklyActiveDays(days: WeeklyStudyDay[]): number {
  return days.filter((d) => d.active).length;
}
