import type { StudentStats } from "./studentStats";

export type BadgeId =
  | "first_lesson"
  | "on_fire"
  | "quiz_master"
  | "perfect"
  | "bookworm"
  | "dedicated";

export type BadgeTone = "primary" | "secondary" | "tertiary" | "muted";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  tone: BadgeTone;
  isUnlocked: (stats: StudentStats) => boolean;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_lesson",
    title: "Bước đầu",
    description: "Bắt đầu học ít nhất một bài",
    tone: "primary",
    isUnlocked: (stats) => stats.lessonsStarted >= 1,
  },
  {
    id: "on_fire",
    title: "On fire",
    description: "Học ít nhất 3 ngày trong tuần này",
    tone: "secondary",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 3,
  },
  {
    id: "quiz_master",
    title: "Quiz master",
    description: "Pass 5 bài tập",
    tone: "tertiary",
    isUnlocked: (stats) => stats.practicePassedCount >= 5,
  },
  {
    id: "perfect",
    title: "Perfect",
    description: "Đạt 100% điểm một bài tập",
    tone: "primary",
    isUnlocked: (stats) => stats.hasPerfectScore,
  },
  {
    id: "bookworm",
    title: "Mọt sách",
    description: "Hoàn thành đọc 3 bài (≥98%)",
    tone: "tertiary",
    isUnlocked: (stats) => stats.lessonsReadComplete >= 3,
  },
  {
    id: "dedicated",
    title: "Kiên trì",
    description: "Làm bài tập tổng cộng 10 lần",
    tone: "secondary",
    isUnlocked: (stats) => stats.totalAttempts >= 10,
  },
];

export function getUnlockedBadges(stats: StudentStats): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.isUnlocked(stats));
}

export function countUnlockedBadges(stats: StudentStats): number {
  return getUnlockedBadges(stats).length;
}
