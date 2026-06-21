import type { StudentStats } from "./studentStats";

export type BadgeId =
  // Study category
  | "study_starter"
  | "study_bookworm"
  | "study_scholar"
  | "study_master"
  | "study_legend"
  // Streak category
  | "streak_1"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "streak_50"
  // XP category
  | "xp_10"
  | "xp_50"
  | "xp_100"
  | "xp_250"
  | "xp_500"
  | "xp_1000"
  // Special category
  | "special_listener"
  | "special_vocab_king"
  | "special_perfectionist"
  | "special_speed_learner"
  | "special_daily_learner"
  | "special_top_student";

export type BadgeTone = "common" | "rare" | "epic" | "legendary" | "muted";

export type BadgeCategory = "study" | "streak" | "xp" | "special";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  category: BadgeCategory;
  tone: BadgeTone;
  isUnlocked: (stats: StudentStats) => boolean;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // === HUY HIỆU HỌC TẬP ===
  {
    id: "study_starter",
    title: "Starter",
    description: "Hoàn thành bài học đầu tiên",
    category: "study",
    tone: "common",
    isUnlocked: (stats) => stats.lessonsCompleted >= 1 || stats.lessonsReadComplete >= 1,
  },
  {
    id: "study_bookworm",
    title: "Bookworm",
    description: "Hoàn thành 5 bài học",
    category: "study",
    tone: "rare",
    isUnlocked: (stats) => stats.lessonsCompleted >= 5,
  },
  {
    id: "study_scholar",
    title: "Scholar",
    description: "Hoàn thành 20 bài học",
    category: "study",
    tone: "epic",
    isUnlocked: (stats) => stats.lessonsCompleted >= 20,
  },
  {
    id: "study_master",
    title: "Master",
    description: "Hoàn thành 50 bài học",
    category: "study",
    tone: "legendary",
    isUnlocked: (stats) => stats.lessonsCompleted >= 50,
  },
  {
    id: "study_legend",
    title: "Legend",
    description: "Hoàn thành 100+ bài học",
    category: "study",
    tone: "legendary",
    isUnlocked: (stats) => stats.lessonsCompleted >= 100,
  },

  // === HUY HIỆU STREAK ===
  {
    id: "streak_1",
    title: "1 Day",
    description: "Duy trì streak 1 ngày",
    category: "streak",
    tone: "common",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 1,
  },
  {
    id: "streak_3",
    title: "3 Days",
    description: "Duy trì streak 3 ngày",
    category: "streak",
    tone: "common",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 3,
  },
  {
    id: "streak_7",
    title: "7 Days",
    description: "Duy trì streak 7 ngày",
    category: "streak",
    tone: "rare",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 7,
  },
  {
    id: "streak_14",
    title: "14 Days",
    description: "Duy trì streak 14 ngày",
    category: "streak",
    tone: "rare",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 7 || stats.totalAttempts >= 14,
  },
  {
    id: "streak_30",
    title: "30 Days",
    description: "Duy trì streak 30 ngày",
    category: "streak",
    tone: "epic",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 7 || stats.totalAttempts >= 30,
  },
  {
    id: "streak_50",
    title: "50 Days",
    description: "Duy trì streak 50 ngày",
    category: "streak",
    tone: "legendary",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 7 || stats.totalAttempts >= 50,
  },

  // === HUY HIỆU XP ===
  {
    id: "xp_10",
    title: "10 XP",
    description: "Tích lũy 10 XP",
    category: "xp",
    tone: "common",
    isUnlocked: (stats) => stats.xp >= 10,
  },
  {
    id: "xp_50",
    title: "50 XP",
    description: "Tích lũy 50 XP",
    category: "xp",
    tone: "common",
    isUnlocked: (stats) => stats.xp >= 50,
  },
  {
    id: "xp_100",
    title: "100 XP",
    description: "Tích lũy 100 XP",
    category: "xp",
    tone: "rare",
    isUnlocked: (stats) => stats.xp >= 100,
  },
  {
    id: "xp_250",
    title: "250 XP",
    description: "Tích lũy 250 XP",
    category: "xp",
    tone: "epic",
    isUnlocked: (stats) => stats.xp >= 250,
  },
  {
    id: "xp_500",
    title: "500 XP",
    description: "Tích lũy 500 XP",
    category: "xp",
    tone: "legendary",
    isUnlocked: (stats) => stats.xp >= 500,
  },
  {
    id: "xp_1000",
    title: "1000 XP",
    description: "Tích lũy 1000+ XP",
    category: "xp",
    tone: "legendary",
    isUnlocked: (stats) => stats.xp >= 1000,
  },

  // === HUY HIỆU ĐẶC BIỆT ===
  {
    id: "special_listener",
    title: "Listener",
    description: "Hoàn thành 10 bài nghe",
    category: "special",
    tone: "rare",
    isUnlocked: (stats) => stats.lessonsCompleted >= 10 || stats.lessonsReadComplete >= 10,
  },
  {
    id: "special_vocab_king",
    title: "Vocabulary King",
    description: "Học 100 từ mới",
    category: "special",
    tone: "rare",
    isUnlocked: (stats) => stats.practicePassedCount >= 5 || stats.totalAttempts >= 20,
  },
  {
    id: "special_perfectionist",
    title: "Perfectionist",
    description: "Làm đúng 10 câu liên tiếp",
    category: "special",
    tone: "epic",
    isUnlocked: (stats) => stats.hasPerfectScore,
  },
  {
    id: "special_speed_learner",
    title: "Speed Learner",
    description: "Hoàn thành bài dưới 5 phút",
    category: "special",
    tone: "epic",
    isUnlocked: (stats) => stats.hasPerfectScore,
  },
  {
    id: "special_daily_learner",
    title: "Daily Learner",
    description: "Học 7 ngày liên tiếp trong tuần",
    category: "special",
    tone: "epic",
    isUnlocked: (stats) => stats.weeklyStreakCount >= 7,
  },
  {
    id: "special_top_student",
    title: "Top Student",
    description: "Top 10 bảng xếp hạng tuần",
    category: "special",
    tone: "legendary",
    isUnlocked: (stats) => stats.xp >= 500,
  },
];

export function getUnlockedBadges(stats: StudentStats): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.isUnlocked(stats));
}

export function countUnlockedBadges(stats: StudentStats): number {
  return getUnlockedBadges(stats).length;
}
