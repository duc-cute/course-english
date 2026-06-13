import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import type { LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";
import { PracticeAttemptBanner } from "../lessonPlayer/exercise/PracticeAttemptBanner";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { VqButton, VqProgressBar } from "../ui";

type HomeContinueCardProps = {
  progress: LessonProgressEntry;
  practiceLatest?: LessonPracticeAttemptBrief | null;
};

export function HomeContinueCard({ progress, practiceLatest }: HomeContinueCardProps) {
  const tab = progress.lastTab ?? "study";
  const href = studentLessonPath({ slug: progress.lessonSlug, id: progress.lessonId }, { tab });
  const pct = Math.round(progress.scrollPercent);
  const isPractice = tab === "practice";

  return (
    <article className="vq-home-continue">
      <div className="vq-home-continue__visual" aria-hidden>
        <MenuBookOutlinedIcon sx={{ fontSize: 56, color: "var(--vq-primary)" }} />
      </div>
      <div className="vq-home-continue__body">
        <div className="vq-home-continue__meta">
          {progress.subjectName ? (
            <span className="vq-home-continue__chip">{progress.subjectName}</span>
          ) : null}
          <h3 className="vq-home-continue__title">{progress.lessonTitle}</h3>
          <p className="vq-home-continue__desc">
            {isPractice ? "Tiếp tục phần bài tập của bài học này." : "Tiếp tục đọc bài học từ chỗ bạn dừng lại."}
          </p>
        </div>

        {isPractice ? (
          practiceLatest ? (
            <div className="vq-home-continue__practice">
              <PracticeAttemptBanner latest={practiceLatest} compact />
            </div>
          ) : (
            <p className="vq-home-continue__hint">Tab Bài tập</p>
          )
        ) : (
          <VqProgressBar
            value={pct}
            showThumb
            label={`Tiến độ: ${pct}%`}
            hint={`Cập nhật ${new Date(progress.updatedAt).toLocaleDateString("vi-VN")}`}
          />
        )}

        <Link to={href} className="vq-home-continue__action">
          <VqButton size="lg">
            <PlayArrowIcon sx={{ fontSize: 20 }} />
            {isPractice ? "Tiếp tục bài tập" : "Tiếp tục học"}
          </VqButton>
        </Link>
      </div>
    </article>
  );
}
