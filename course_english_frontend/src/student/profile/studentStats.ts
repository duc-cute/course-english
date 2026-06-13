import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import type { LessonRecord } from "../../shared/api/lesson";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { countWeeklyActiveDays, type WeeklyStudyDay } from "../home/getWeeklyStudyDays";
import { getLessonCardMeta, isLessonCompleted } from "../lessons/lessonListUtils";

export type StudentStats = {
  xp: number;
  weeklyStreakCount: number;
  weeklyDays: WeeklyStudyDay[];
  lessonsStarted: number;
  lessonsReadComplete: number;
  practicePassedCount: number;
  totalAttempts: number;
  hasPerfectScore: boolean;
  lessonsCompleted: number;
};

export function computeXp(input: {
  practicePassedCount: number;
  lessonsReadComplete: number;
  totalAttempts: number;
}): number {
  return (
    input.practicePassedCount * 50 +
    input.lessonsReadComplete * 20 +
    input.totalAttempts * 5
  );
}

export function computeStudentStats(
  lessons: LessonRecord[],
  localProgress: Record<string, LessonProgressEntry>,
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
  weeklyDays: WeeklyStudyDay[],
): StudentStats {
  let lessonsStarted = 0;
  let lessonsReadComplete = 0;
  let practicePassedCount = 0;
  let totalAttempts = 0;
  let hasPerfectScore = false;
  let lessonsCompleted = 0;

  for (const lesson of lessons) {
    const meta = getLessonCardMeta(lesson.id, localProgress, practiceSummary);
    if (meta.readPct > 2) lessonsStarted += 1;
    if (meta.readDone) lessonsReadComplete += 1;
    if (meta.practicePassed) practicePassedCount += 1;
    if (isLessonCompleted(meta)) lessonsCompleted += 1;

    const summary = practiceSummary[lesson.id];
    totalAttempts += summary?.attemptCount ?? 0;

    const bestScore = summary?.best?.scorePercent ?? 0;
    const latestScore = summary?.latest?.scorePercent ?? 0;
    if (bestScore >= 100 || latestScore >= 100) {
      hasPerfectScore = true;
    }
  }

  const weeklyStreakCount = countWeeklyActiveDays(weeklyDays);
  const xp = computeXp({ practicePassedCount, lessonsReadComplete, totalAttempts });

  return {
    xp,
    weeklyStreakCount,
    weeklyDays,
    lessonsStarted,
    lessonsReadComplete,
    practicePassedCount,
    totalAttempts,
    hasPerfectScore,
    lessonsCompleted,
  };
}
