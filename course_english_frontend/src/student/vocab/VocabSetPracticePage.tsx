import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import { Alert } from "@mui/material";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { useFeatureFlags } from "../../shared/featureFlags/useFeatureFlags";
import { VocabularyFlashcard } from "../lessonPlayer/vocabulary/VocabularyFlashcard";
import { VocabWordList } from "./VocabWordList";
import { toResolvedVocabularyItems } from "./vocabUtils";
import { useVocabSetDetail } from "./useVocabSetDetail";

type PracticeMode = "flashcard" | "list";

export function VocabSetPracticePage() {
  const { setId } = useParams<{ setId: string }>();
  const { set, loading, error } = useVocabSetDetail(setId);
  const { flags } = useFeatureFlags();
  const [mode, setMode] = useState<PracticeMode>("flashcard");

  const items = useMemo(
    () => toResolvedVocabularyItems(set?.items ?? []),
    [set?.items],
  );

  return (
    <div className="vq-page vq-vocab-page vq-vocab-practice">
      <Link to={studentRoutePaths.vocab} className="vq-vocab-practice__back">
        <ArrowBackIcon sx={{ fontSize: 20 }} />
        Quay lại danh sách
      </Link>

      {loading ? (
        <div className="vq-vocab-practice__skeleton" aria-hidden />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : !set || items.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: "14px" }}>
          Bộ từ vựng không có từ nào để ôn tập.
        </Alert>
      ) : (
        <>
          <header className="vq-vocab-practice__head">
            <h1 className="vq-vocab-practice__title">{set.title}</h1>
            {set.subjectName ? <p className="vq-vocab-practice__subject">{set.subjectName}</p> : null}
            {set.description?.trim() ? (
              <p className="vq-vocab-practice__desc">{set.description}</p>
            ) : null}
          </header>

          <div className="vq-vocab-mode-tabs" role="tablist" aria-label="Chế độ ôn tập">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "flashcard"}
              className={`vq-vocab-mode-tabs__btn${mode === "flashcard" ? " is-active" : ""}`}
              onClick={() => setMode("flashcard")}
            >
              <StyleOutlinedIcon sx={{ fontSize: 20 }} />
              Flashcard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "list"}
              className={`vq-vocab-mode-tabs__btn${mode === "list" ? " is-active" : ""}`}
              onClick={() => setMode("list")}
            >
              <FormatListBulletedIcon sx={{ fontSize: 20 }} />
              Danh sách
            </button>
          </div>

          {mode === "flashcard" ? (
            <div className="vq-vocab-flashcard-wrap">
              <VocabularyFlashcard
                items={items}
                showPhonetic
                audioEnabled={flags.vocabularyAudioEnabled}
                audioAccent={flags.vocabularyAudioAccent}
              />
              <p className="vq-vocab-flashcard-hint">Chạm thẻ để lật xem nghĩa tiếng Việt</p>
            </div>
          ) : (
            <VocabWordList items={items} />
          )}
        </>
      )}
    </div>
  );
}
