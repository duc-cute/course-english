import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import type { VocabularySetAssignmentRecord } from "../../shared/api/vocabularySetAssignment";
import type { VocabularyPracticeSummaryItem } from "../../shared/api/vocabularyPracticeAttempt";
import { studentRoutePaths } from "../../shared/constants/paths";
import { formatVocabCount } from "./vocabUtils";
import { formatRelativeTime } from "./vocabProgressUtils";

type AssignedVocabSetCardProps = {
  assignment: VocabularySetAssignmentRecord;
  practiceSummary?: VocabularyPracticeSummaryItem | null;
};

export function AssignedVocabSetCard({ assignment, practiceSummary }: AssignedVocabSetCardProps) {
  const coverUrl = assignment.coverImageUrl
    ? resolveStorageAssetUrl(assignment.coverImageUrl)
    : null;
  const title = assignment.vocabularySetTitle || "Bộ từ vựng";
  const href = `${studentRoutePaths.vocabSet(assignment.vocabularySetId)}?assignmentId=${assignment.id}`;

  const best = practiceSummary?.best;
  const latest = practiceSummary?.latest;

  let status: "not_started" | "learning" | "completed" = "not_started";
  let statusLabel = "Chưa bắt đầu";
  let progress = 0;

  if (best) {
    progress = best.scorePercent;
    if (progress === 100) {
      status = "completed";
      statusLabel = "Hoàn thành";
    } else if (progress > 0) {
      status = "learning";
      statusLabel = "Đang học";
    }
  }

  const relativeTime = formatRelativeTime(latest?.completedAt || assignment.assignedAt);

  return (
    <Link to={href} className="vq-vocab-card">
      <div className="vq-vocab-card__cover-wrapper">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="vq-vocab-card__cover-img" loading="lazy" />
        ) : (
          <div className="vq-vocab-card__icon-fallback" aria-hidden>
            <MenuBookOutlinedIcon sx={{ fontSize: 28 }} />
          </div>
        )}
        <span
          className={`vq-vocab-card__status-badge-overlay vq-vocab-card__status-badge-overlay--${status}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="vq-vocab-card__body">
        <div className="vq-vocab-card__title-row">
          <h3 className="vq-vocab-card__title" title={title}>
            {title}
          </h3>
          {status === "completed" ? (
            <span className="vq-vocab-card__crown-icon" title="Hoàn thành xuất sắc" aria-hidden>
              👑
            </span>
          ) : null}
        </div>

        <p className="vq-vocab-card__count">{formatVocabCount(assignment.itemCount)}</p>

        <div className="vq-vocab-card__progress-section">
          <div className="vq-vocab-card__progress-bar-bg">
            <div
              className={`vq-vocab-card__progress-bar-fill vq-vocab-card__progress-bar-fill--${status}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="vq-vocab-card__progress-percentage">{progress}%</span>
        </div>

        <div className="vq-vocab-card__footer">
          <span className="vq-vocab-card__update-time">{relativeTime}</span>
        </div>
      </div>
    </Link>
  );
}
