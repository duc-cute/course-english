import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import type { LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";
import { PracticeAttemptBanner } from "../lessonPlayer/exercise/PracticeAttemptBanner";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { VqButton } from "../ui";

type HomeContinueCardProps = {
  progress: LessonProgressEntry;
  practiceLatest?: LessonPracticeAttemptBrief | null;
};

function formatLastStudyDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function HomeContinueCard({ progress, practiceLatest }: HomeContinueCardProps) {
  const tab = progress.lastTab ?? "study";
  const href = studentLessonPath({ slug: progress.lessonSlug, id: progress.lessonId }, { tab });
  const pct = Math.round(progress.scrollPercent);
  const isPractice = tab === "practice";

  return (
    <article className="vq-home-continue">
      <div className={`vq-home-continue__poster${progress.coverImageUrl ? " has-cover" : ""}`}>
        <div className="vq-home-continue__visual">
          {progress.coverImageUrl ? (
            <img src={progress.coverImageUrl} alt="" className="vq-home-continue__cover" />
          ) : (
            <div className="vq-home-continue__placeholder" aria-hidden>
              <MenuBookOutlinedIcon sx={{ fontSize: 52, color: "#2563eb" }} />
            </div>
          )}
        </div>

        <div className="vq-home-continue__progress" aria-label={`Tiến độ đọc bài: ${pct}%`}>
          <p className="vq-home-continue__progress-label">Tiến độ: {pct}%</p>
          <div className="vq-home-continue__progress-track">
            <div className="vq-home-continue__progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="vq-home-continue__body">
        <span className="vq-home-continue__chip">
          {progress.subjectName?.toUpperCase() ?? "TIẾNG ANH"}
        </span>

        <h3 className="vq-home-continue__title">{progress.lessonTitle}</h3>

        <p className="vq-home-continue__desc">
          {isPractice
            ? "Tiếp tục phần bài tập để hoàn thành bài học này nhé!"
            : "Tiếp tục học để hoàn thành bài học này và giữ vững phong độ nhé!"}
        </p>

        <p className="vq-home-continue__date">
          Lần học gần nhất: {formatLastStudyDate(progress.updatedAt)}
        </p>

        {isPractice ? (
          practiceLatest ? (
            <div className="vq-home-continue__practice">
              <PracticeAttemptBanner latest={practiceLatest} compact />
            </div>
          ) : (
            <p className="vq-home-continue__hint">Tab Bài tập</p>
          )
        ) : null}

        <Link to={href} className="vq-home-continue__action">
          <VqButton size="lg" className="vq-home-continue__btn">
            <PlayArrowIcon sx={{ fontSize: 22 }} />
            {isPractice ? "TIẾP TỤC BÀI TẬP" : "TIẾP TỤC HỌC"}
          </VqButton>
        </Link>
      </div>
    </article>
  );
}
