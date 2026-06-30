import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import { resolveStorageAssetUrl } from "../../shared/api/file";
import type { VocabularySetRecord } from "../../shared/api/vocabularySet";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqBadge } from "../ui/VqBadge";
import { formatVocabCount } from "./vocabUtils";

type VocabSetCardProps = {
  set: VocabularySetRecord;
};

export function VocabSetCard({ set }: VocabSetCardProps) {
  const coverUrl = set.coverImageUrl ? resolveStorageAssetUrl(set.coverImageUrl) : null;

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
      </div>
      <span className="vq-vocab-card__cta">Ôn tập →</span>
    </Link>
  );
}
