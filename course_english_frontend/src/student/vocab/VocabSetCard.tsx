import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import type { VocabularySetRecord } from "../../shared/api/vocabularySet";
import {
  isVocabPracticePassed,
  type VocabularyPracticeSummaryItem,
} from "../../shared/api/vocabularyPracticeAttempt";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqBadge } from "../ui/VqBadge";
import { formatVocabCount } from "./vocabUtils";
import { vocabContinueCta } from "./vocabProgressUtils";

type VocabSetCardProps = {
  set: VocabularySetRecord;
  practiceSummary?: VocabularyPracticeSummaryItem | null;
};

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function VocabSetCard({ set, practiceSummary }: VocabSetCardProps) {
  const coverUrl = set.coverImageUrl ? resolveStorageAssetUrl(set.coverImageUrl) : null;
  const best = practiceSummary?.best;
  const latest = practiceSummary?.latest;
  const passed = isVocabPracticePassed(best);
  const lastStudiedLabel = formatDate(latest?.completedAt);
  const cta = vocabContinueCta(practiceSummary);

  return (
    <Link to={studentRoutePaths.vocabSet(set.id)} className="vq-vocab-card">
      {coverUrl ? (
        <div className="vq-vocab-card__cover" aria-hidden>
          <img src={coverUrl} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="vq-vocab-card__icon" aria-hidden>
          <MenuBookOutlinedIcon />
        </div>
      )}
      <div className="vq-vocab-card__body">
        <h3 className="vq-vocab-card__title">{set.title}</h3>
        {set.description?.trim() ? (
          <p className="vq-vocab-card__desc">{set.description}</p>
        ) : null}
        <div className="vq-vocab-card__meta">
          {set.subjectName ? <VqBadge tone="muted">{set.subjectName}</VqBadge> : null}
          <span className="vq-vocab-card__count">{formatVocabCount(set.itemCount)}</span>
        </div>
        {best ? (
          <div className="vq-vocab-card__progress">
            <span
              className={`vq-vocab-card__score${passed ? " vq-vocab-card__score--passed" : ""}`}
            >
              {passed ? "Đã đạt" : "Chưa đạt"} · {best.scorePercent}%
            </span>
            {lastStudiedLabel ? (
              <span className="vq-vocab-card__count">Luyện: {lastStudiedLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <span className="vq-vocab-card__cta">{cta}</span>
    </Link>
  );
}
