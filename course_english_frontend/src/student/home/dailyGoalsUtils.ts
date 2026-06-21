import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import type { LessonProgressEntry } from "../lessonProgressStorage";

export type DailyGoal = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  progress?: { current: number; target: number };
};

function isToday(dateIso: string): boolean {
  return new Date(dateIso).toDateString() === new Date().toDateString();
}

function countPracticesToday(
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
): number {
  let count = 0;
  for (const item of Object.values(practiceSummary)) {
    const completedAt = item.latest?.completedAt;
    if (completedAt && isToday(completedAt)) {
      count += 1;
    }
  }
  return count;
}

export function buildDailyGoals(
  continueProgress: LessonProgressEntry | null,
  practiceSummary: Record<string, LessonPracticeSummaryItem>,
): DailyGoal[] {
  const lessonDoneToday =
    continueProgress != null &&
    isToday(continueProgress.updatedAt) &&
    (continueProgress.scrollPercent >= 95 || continueProgress.lastTab === "practice");

  const exercisesToday = countPracticesToday(practiceSummary);
  const exerciseTarget = 3;
  const wordTarget = 5;

  return [
    {
      id: "lesson",
      title: "Hoàn thành 1 bài học",
      detail: lessonDoneToday ? "Xong rồi! 🎉" : continueProgress ? "Đang học dở" : "Chưa bắt đầu",
      done: lessonDoneToday,
    },
    {
      id: "words",
      title: "Học 5 từ mới",
      detail: `0/${wordTarget} từ`,
      done: false,
      progress: { current: 0, target: wordTarget },
    },
    {
      id: "exercises",
      title: "Làm 3 bài tập",
      detail: `${exercisesToday}/${exerciseTarget} bài`,
      done: exercisesToday >= exerciseTarget,
      progress: { current: exercisesToday, target: exerciseTarget },
    },
  ];
}
