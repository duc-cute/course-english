import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import { IconButton, Tooltip } from "@mui/material";
import type { VocabularyWordRecord } from "../../../shared/api/vocabularyWord";
import { VocabularyAudioPreview } from "./VocabularyAudioPreview";

type VocabularyWordCardProps = {
  word: VocabularyWordRecord;
  onOpen: (word: VocabularyWordRecord) => void;
};

function hasAudio(word: VocabularyWordRecord) {
  return Boolean(word.audioUkUrl?.trim() || word.audioUsUrl?.trim());
}

function enrichBadge(word: VocabularyWordRecord) {
  if (word.enrichedAt) {
    return <span className="vocab-word-card__badge vocab-word-card__badge--enriched">Đã enrich</span>;
  }
  return <span className="vocab-word-card__badge vocab-word-card__badge--pending">Chưa enrich</span>;
}

export function VocabularyWordCard({ word, onOpen }: VocabularyWordCardProps) {
  return (
    <article className="vocab-word-card">
      <button type="button" className="vocab-word-card__main" onClick={() => onOpen(word)}>
        <div className="vocab-word-card__top">
          <h3 className="vocab-word-card__en">{word.wordEn}</h3>
          <Tooltip title="Chi tiết / Enrich">
            <IconButton
              size="small"
              className="vocab-word-card__edit"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(word);
              }}
              aria-label={`Sửa từ ${word.wordEn}`}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        <p className="vocab-word-card__vi">{word.meaningVi?.trim() || "Chưa có nghĩa"}</p>

        <div className="vocab-word-card__meta">
          {word.phonetic?.trim() ? (
            <span className="vocab-word-card__ipa">{word.phonetic}</span>
          ) : (
            <span className="vocab-word-card__ipa vocab-word-card__ipa--empty">Chưa có IPA</span>
          )}
          {word.partOfSpeech?.trim() ? (
            <span className="vocab-word-card__pos">{word.partOfSpeech}</span>
          ) : null}
        </div>
      </button>

      <footer className="vocab-word-card__footer">
        <div className="vocab-word-card__audio">
          {hasAudio(word) ? (
            <VocabularyAudioPreview audioUkUrl={word.audioUkUrl} audioUsUrl={word.audioUsUrl} compact />
          ) : (
            <span className="vocab-word-card__audio-empty">
              <RecordVoiceOverOutlinedIcon fontSize="inherit" />
              Chưa có audio
            </span>
          )}
        </div>
        {enrichBadge(word)}
      </footer>
    </article>
  );
}

export function VocabularyWordCreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="vocab-word-create-card" onClick={onClick}>
      <span className="vocab-word-create-card__icon" aria-hidden>
        +
      </span>
      <span className="vocab-word-create-card__label">Thêm từ mới</span>
      <span className="vocab-word-create-card__hint">Tự động enrich IPA + audio</span>
    </button>
  );
}
