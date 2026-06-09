import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { LessonRecord } from "../../shared/api/lesson";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";

type LessonReaderUpNextProps = {
  nextLesson: LessonRecord;
};

export function LessonReaderUpNext({ nextLesson }: LessonReaderUpNextProps) {
  const href = studentLessonPath(nextLesson);

  return (
    <footer className="lesson-reader-up-next">
      <Button component={Link} to={href} className="lesson-reader-up-next-btn" fullWidth>
        <span className="lesson-reader-up-next-inner">
          <span className="lesson-reader-up-next-text">
            <Typography className="lesson-reader-up-next-label" variant="caption">
              Bài tiếp theo
            </Typography>
            <Typography className="lesson-reader-up-next-title" variant="subtitle1">
              {nextLesson.title}
            </Typography>
            {nextLesson.subjectName ? (
              <Typography variant="caption" color="text.secondary">
                {nextLesson.subjectName}
              </Typography>
            ) : null}
          </span>
          <span className="lesson-reader-up-next-arrow" aria-hidden>
            <ArrowForwardIcon />
          </span>
        </span>
      </Button>
    </footer>
  );
}
