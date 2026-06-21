import CheckIcon from "@mui/icons-material/Check";
import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { buildDailyGoals } from "./dailyGoalsUtils";

type HomeDailyGoalsProps = {
  continueProgress: LessonProgressEntry | null;
  practiceSummary: Record<string, LessonPracticeSummaryItem>;
};

export function HomeDailyGoals({ continueProgress, practiceSummary }: HomeDailyGoalsProps) {
  const goals = buildDailyGoals(continueProgress, practiceSummary);
  const doneCount = goals.filter((g) => g.done).length;
  const allDone = doneCount === goals.length;

  return (
    <article className="vq-home-panel vq-home-panel--goals">
      <div className="vq-home-panel__head">
        <h3 className="vq-home-panel__title">
          <span className="vq-home-panel__title-icon" aria-hidden>🎯</span>
          Mục tiêu hôm nay
        </h3>
        <span className="vq-home-goals__see-all">
          Xem tất cả &gt;
        </span>
      </div>
      <ul className="vq-home-goals">
        {goals.map((goal) => (
          <li key={goal.id} className={`vq-home-goal${goal.done ? " vq-home-goal--done" : ""}`}>
            <span className="vq-home-goal__check" aria-hidden>
              {goal.done ? <CheckIcon sx={{ fontSize: 15 }} /> : null}
            </span>
            <div className="vq-home-goal__content">
              <p className="vq-home-goal__title">{goal.title}</p>
              <p className="vq-home-goal__detail">{goal.detail}</p>
            </div>
            <span className="vq-home-goal__xp">
              {goal.id === "lesson" ? "+20 XP" : "+10 XP"}
            </span>
          </li>
        ))}
      </ul>
      <div className={`vq-home-goals__bonus${allDone ? " vq-home-goals__bonus--done" : ""}`}>
        <div className="vq-home-goals__bonus-left">
          <span className="vq-home-goals__gift" aria-hidden>🎁</span>
          <span className="vq-home-goals__bonus-text">
            {allDone ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay" : "Hoàn thành tất cả để nhận"}
          </span>
        </div>
        <span className="vq-home-goals__xp">+30 XP</span>
      </div>
    </article>
  );
}
