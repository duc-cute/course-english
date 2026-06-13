import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CheckIcon from "@mui/icons-material/Check";
import type { LessonProgressEntry } from "../lessonProgressStorage";

type DailyGoal = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
};

function buildGoals(progress: LessonProgressEntry | null): DailyGoal[] {
  const lessonDoneToday =
    progress != null &&
    new Date(progress.updatedAt).toDateString() === new Date().toDateString() &&
    (progress.scrollPercent >= 95 || progress.lastTab === "practice");

  return [
    {
      id: "lesson",
      title: "Hoàn thành 1 bài học",
      detail: lessonDoneToday ? "Xong hôm nay!" : progress ? "Đang học dở" : "Chưa bắt đầu",
      done: lessonDoneToday,
    },
    {
      id: "words",
      title: "Học 5 từ mới",
      detail: "Sắp có ở Trung tâm từ vựng",
      done: false,
    },
    {
      id: "review",
      title: "Ôn lại câu sai",
      detail: "Sắp có trong bài tập",
      done: false,
    },
  ];
}

type HomeDailyGoalsProps = {
  continueProgress: LessonProgressEntry | null;
};

export function HomeDailyGoals({ continueProgress }: HomeDailyGoalsProps) {
  const goals = buildGoals(continueProgress);
  const doneCount = goals.filter((g) => g.done).length;

  return (
    <article className="vq-home-panel vq-home-panel--goals">
      <h3 className="vq-home-panel__title">
        <AssignmentOutlinedIcon sx={{ fontSize: 22 }} />
        Mục tiêu hôm nay
      </h3>
      <ul className="vq-home-goals">
        {goals.map((goal) => (
          <li key={goal.id} className={`vq-home-goal${goal.done ? " vq-home-goal--done" : ""}`}>
            <span className="vq-home-goal__check" aria-hidden>
              {goal.done ? <CheckIcon sx={{ fontSize: 16 }} /> : null}
            </span>
            <div>
              <p className="vq-home-goal__title">{goal.title}</p>
              <p className="vq-home-goal__detail">{goal.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="vq-home-goals__bonus">
        Hoàn thành {doneCount}/{goals.length} mục tiêu · Bonus XP sắp ra mắt
      </p>
    </article>
  );
}
