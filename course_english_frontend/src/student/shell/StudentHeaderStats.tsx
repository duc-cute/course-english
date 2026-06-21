import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import { buildDailyGoals } from "../home/dailyGoalsUtils";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import type { StudentStats } from "../profile/studentStats";

type StudentHeaderStatsProps = {
  stats: StudentStats;
  continueProgress?: LessonProgressEntry | null;
  practiceSummary?: Record<string, LessonPracticeSummaryItem>;
  variant?: "streak-only" | "full" | "mobile-cards";
  className?: string;
};

type StatPill = {
  id: string;
  text: string;
  tone: "streak" | "xp" | "lessons" | "goal" | "rank";
  emoji: string;
};

export function StudentHeaderStats({
  stats,
  continueProgress = null,
  practiceSummary = {},
  variant = "streak-only",
  className = "",
}: StudentHeaderStatsProps) {
  const goals = buildDailyGoals(continueProgress, practiceSummary);
  const goalsDone = goals.filter((g) => g.done).length;

  if (variant === "mobile-cards") {
    const cards = [
      {
        id: "streak",
        emoji: "🔥",
        value: stats.weeklyStreakCount,
        label: "Streak ngày",
        tone: "streak",
      },
      {
        id: "xp",
        emoji: "⭐",
        value: stats.xp,
        label: "Tổng XP",
        tone: "xp",
      },
      {
        id: "lessons",
        emoji: "📚",
        value: stats.lessonsCompleted,
        label: "Bài đã học",
        tone: "lessons",
      },
      {
        id: "goal",
        emoji: "🎯",
        value: `${goalsDone}/${goals.length}`,
        label: "Mục tiêu hôm nay",
        tone: "goal",
      },
    ];

    return (
      <div className={`student-vq-mobile-stats-row ${className}`} role="list" aria-label="Thống kê nhanh">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`student-vq-mobile-stats-card student-vq-mobile-stats-card--${card.tone}`}
            role="listitem"
          >
            <div className={`student-vq-mobile-stats-card__icon-wrap student-vq-mobile-stats-card__icon-wrap--${card.tone}`} aria-hidden>
              {card.emoji}
            </div>
            <span className="student-vq-mobile-stats-card__value">{card.value}</span>
            <span className="student-vq-mobile-stats-card__label">{card.label}</span>
          </div>
        ))}
      </div>
    );
  }

  const allPills: StatPill[] = [
    {
      id: "streak",
      emoji: "🔥",
      text: `${stats.weeklyStreakCount} Ngày`,
      tone: "streak",
    },
    {
      id: "xp",
      emoji: "⭐",
      text: `${stats.xp} XP`,
      tone: "xp",
    },
    {
      id: "lessons",
      emoji: "📚",
      text: `${stats.lessonsCompleted} bài`,
      tone: "lessons",
    },
    {
      id: "goal",
      emoji: "🎯",
      text: `${goalsDone}/${goals.length} mục tiêu`,
      tone: "goal",
    },
  ];

  const pills =
    variant === "full" ? allPills : allPills.filter((pill) => pill.id === "streak");

  const rootClass = ["student-vq-header-stats", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} role="list" aria-label="Thống kê nhanh">
      {pills.map((pill) => (
        <div
          key={pill.id}
          className={`student-vq-header-stats__pill student-vq-header-stats__pill--${pill.tone}`}
          role="listitem"
        >
          <span className="student-vq-header-stats__emoji" aria-hidden>
            {pill.emoji}
          </span>
          <span className="student-vq-header-stats__text">{pill.text}</span>
        </div>
      ))}
    </div>
  );
}
