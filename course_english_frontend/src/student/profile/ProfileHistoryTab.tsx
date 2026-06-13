import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { CircularProgress } from "@mui/material";
import type { LessonPracticeSummaryItem } from "../../shared/api/lessonPracticeAttempt";
import type { LessonRecord } from "../../shared/api/lesson";
import { formatAttemptResult, usePracticeHistory } from "./usePracticeHistory";

type ProfileHistoryTabProps = {
  lessons: LessonRecord[];
  practiceSummary: Record<string, LessonPracticeSummaryItem>;
  lessonTitleById: Record<string, string>;
};

export function ProfileHistoryTab({
  lessons,
  practiceSummary,
  lessonTitleById,
}: ProfileHistoryTabProps) {
  const { rows, loading, error } = usePracticeHistory(
    lessons,
    practiceSummary,
    lessonTitleById,
    true,
  );

  if (loading) {
    return (
      <div className="vq-profile-history-loading">
        <CircularProgress size={28} />
      </div>
    );
  }

  if (error) {
    return <p className="vq-profile-history-empty">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="vq-profile-history-empty">
        <HistoryOutlinedIcon sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
        <p>Chưa có lần làm bài tập nào.</p>
        <span>Làm bài tập trong lesson player để thấy lịch sử ở đây.</span>
      </div>
    );
  }

  return (
    <ul className="vq-profile-history">
      {rows.map((row) => {
        const dateLabel = row.completedAt
          ? new Date(row.completedAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        const passed = formatAttemptResult(row) === "Đạt";

        return (
          <li key={row.id} className="vq-profile-history__row">
            <div className="vq-profile-history__main">
              <span className="vq-profile-history__title">{row.lessonTitle}</span>
              <span className="vq-profile-history__meta">
                {row.correctCount}/{row.totalCount} câu · {dateLabel}
              </span>
            </div>
            <span
              className={`vq-profile-history__score${passed ? " vq-profile-history__score--pass" : ""}`}
            >
              {formatAttemptResult(row)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
