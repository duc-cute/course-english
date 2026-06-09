import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button, LinearProgress, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";
import { PracticeAttemptBanner } from "../lessonPlayer/exercise/PracticeAttemptBanner";
import type { LessonProgressEntry } from "../lessonProgressStorage";

type ContinueLearningCardProps = {
  progress: LessonProgressEntry;
  practiceLatest?: LessonPracticeAttemptBrief | null;
};

export function ContinueLearningCard({ progress, practiceLatest }: ContinueLearningCardProps) {
  const tab = progress.lastTab ?? "study";
  const href = studentLessonPath(
    { slug: progress.lessonSlug, id: progress.lessonId },
    { tab },
  );
  const pct = Math.round(progress.scrollPercent);
  const isPractice = tab === "practice";

  return (
    <article className="student-continue-card">
      <Typography className="student-continue-label" variant="caption">
        {isPractice ? "Tiếp tục bài tập" : "Tiếp tục học"}
      </Typography>
      <Typography className="student-continue-title" variant="subtitle1">
        {progress.lessonTitle}
      </Typography>
      {progress.subjectName ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {progress.subjectName}
        </Typography>
      ) : null}
      {isPractice ? (
        practiceLatest ? (
          <div className="student-continue-practice-banner">
            <PracticeAttemptBanner latest={practiceLatest} compact />
          </div>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Tab Bài tập
          </Typography>
        )
      ) : (
        <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, mb: 1.5 }} />
      )}
      <div className="student-continue-footer">
        <Typography variant="caption" sx={{ color: "var(--bio-teal-dark, #00685f)", fontWeight: 600 }}>
          {isPractice ? "Đang làm bài tập" : `${pct}%`} · cập nhật{" "}
          {new Date(progress.updatedAt).toLocaleDateString("vi-VN")}
        </Typography>
        <Button
          className="student-btn-teal student-continue-btn"
          component={Link}
          to={href}
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
        >
          Tiếp tục
        </Button>
      </div>
    </article>
  );
}
