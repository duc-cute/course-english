import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button, LinearProgress, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { paths } from "../../shared/constants/paths";
import type { LessonProgressEntry } from "../lessonProgressStorage";

type ContinueLearningCardProps = {
  progress: LessonProgressEntry;
};

export function ContinueLearningCard({ progress }: ContinueLearningCardProps) {
  const href = `/${paths.STUDENT}/${paths.STUDENT_LESSONS}/${progress.lessonId}`;
  const pct = Math.round(progress.scrollPercent);

  return (
    <article className="student-continue-card">
      <Typography className="student-continue-label" variant="caption">
        Tiếp tục học
      </Typography>
      <Typography className="student-continue-title" variant="subtitle1">
        {progress.lessonTitle}
      </Typography>
      {progress.subjectName ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {progress.subjectName}
        </Typography>
      ) : null}
      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, mb: 1.5 }} />
      <Typography variant="caption" sx={{ color: "var(--bio-teal-dark, #00685f)", fontWeight: 600 }}>
        {pct}% · cập nhật {new Date(progress.updatedAt).toLocaleDateString("vi-VN")}
      </Typography>
      <Button
        className="student-btn-teal"
        component={Link}
        to={href}
        variant="contained"
        size="small"
        startIcon={<PlayArrowIcon />}
        sx={{ mt: 1.5 }}
      >
        Tiếp tục
      </Button>
    </article>
  );
}
