import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import type { LessonRecord } from "../../shared/api/lesson";
import type { LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";
import { PracticeAttemptBanner } from "../lessonPlayer/exercise/PracticeAttemptBanner";
import { VqProgressBar } from "../ui";
import type { LessonCardMeta } from "./lessonListUtils";
import { Link } from "react-router-dom";

type LessonListCardProps = {
  lesson: LessonRecord;
  meta: LessonCardMeta;
  latestAttempt?: LessonPracticeAttemptBrief | null;
};

export function LessonListCard({ lesson, meta, latestAttempt }: LessonListCardProps) {
  const href = studentLessonPath(lesson);

  return (
    <Link to={href} className="vq-lesson-card">
      <div className="vq-lesson-card__main">
        <h3 className="vq-lesson-card__title">{lesson.title}</h3>
        <div className="vq-lesson-card__chips">
          {lesson.subjectName ? <span className="vq-lesson-card__chip vq-lesson-card__chip--subject">{lesson.subjectName}</span> : null}
          {lesson.blockCount != null && lesson.blockCount > 0 ? (
            <span className="vq-lesson-card__chip">{lesson.blockCount} phần</span>
          ) : null}
          {meta.readDone ? (
            <span className="vq-lesson-card__chip vq-lesson-card__chip--done">Đã đọc</span>
          ) : meta.readInProgress ? (
            <span className="vq-lesson-card__chip vq-lesson-card__chip--progress">
              <MenuBookOutlinedIcon sx={{ fontSize: 14 }} />
              Đọc {meta.readPct}%
            </span>
          ) : null}
          {meta.practicePassed ? (
            <span className="vq-lesson-card__chip vq-lesson-card__chip--passed">
              <CheckCircleIcon sx={{ fontSize: 14 }} />
              Đã đạt
            </span>
          ) : null}
          {meta.latestScoreLabel ? (
            <span className="vq-lesson-card__chip vq-lesson-card__chip--score">{meta.latestScoreLabel}</span>
          ) : null}
        </div>
        {latestAttempt ? (
          <div className="vq-lesson-card__attempt">
            <PracticeAttemptBanner latest={latestAttempt} compact />
          </div>
        ) : null}
        {lesson.summary ? <p className="vq-lesson-card__summary">{lesson.summary}</p> : null}
      </div>
      {!meta.readDone && meta.readPct > 0 ? (
        <div className="vq-lesson-card__progress">
          <VqProgressBar value={meta.readPct} label={`${meta.readPct}%`} />
        </div>
      ) : null}
    </Link>
  );
}
