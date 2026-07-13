import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { isPracticePassed } from "../../../shared/api/lessonPracticeAttempt";

type PracticeAttemptBannerLatest = {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  passScorePercent: number;
  completedAt?: string;
};

type PracticeAttemptBannerProps = {
  latest?: PracticeAttemptBannerLatest | null;
  onReview?: () => void;
  compact?: boolean;
};

export function PracticeAttemptBanner({ latest, onReview, compact }: PracticeAttemptBannerProps) {
  if (!latest) return null;

  const passed = isPracticePassed(latest);
  const dateLabel = latest.completedAt
    ? new Date(latest.completedAt).toLocaleDateString("vi-VN")
    : null;

  return (
    <div className={`practice-attempt-banner${passed ? " practice-attempt-banner--pass" : ""}`}>
      <div className="practice-attempt-banner-main">
        {passed ? (
          <CheckCircleOutlineIcon className="practice-attempt-banner-icon" sx={{ fontSize: 20 }} />
        ) : null}
        <span>
          Lần trước: <strong>{latest.correctCount}/{latest.totalCount}</strong> ({latest.scorePercent}%)
          {dateLabel ? ` · ${dateLabel}` : ""}
        </span>
      </div>
      {onReview && !compact ? (
        <button type="button" className="practice-attempt-banner-review" onClick={onReview}>
          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
          Xem lại
        </button>
      ) : null}
    </div>
  );
}
