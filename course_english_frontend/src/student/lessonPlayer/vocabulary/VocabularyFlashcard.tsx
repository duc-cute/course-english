import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useCallback, useState } from "react";
import type { ResolvedVocabularyItem } from "../../../shared/lesson/vocabularyPayload";

type VocabularyFlashcardProps = {
  items: ResolvedVocabularyItem[];
  showPhonetic?: boolean;
};

export function VocabularyFlashcard({ items, showPhonetic = true }: VocabularyFlashcardProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = items.length;
  const current = items[index];

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(total - 1, nextIndex)));
      setFlipped(false);
    },
    [total],
  );

  const handlePrev = () => goTo(index - 1);
  const handleNext = () => goTo(index + 1);
  const handleFlip = () => setFlipped((f) => !f);

  if (!current) return null;

  return (
    <div className="vocabulary-flashcard">
      <div className="vocabulary-flashcard-progress">
        <span className="vocabulary-flashcard-progress-count">
          {index + 1} / {total}
        </span>
        <div
          className="vocabulary-flashcard-progress-bar"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="vocabulary-flashcard-progress-fill"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className={`vocabulary-flashcard-card${flipped ? " vocabulary-flashcard-card--flipped" : ""}`}
        onClick={handleFlip}
        aria-label={flipped ? "Xem mặt trước" : "Lật thẻ xem nghĩa"}
      >
        <div className="vocabulary-flashcard-inner">
          <div className="vocabulary-flashcard-face vocabulary-flashcard-face--front">
            <span className="vocabulary-flashcard-word">{current.wordEn}</span>
            {showPhonetic && current.phonetic ? (
              <span className="vocabulary-flashcard-phonetic">{current.phonetic}</span>
            ) : null}
          </div>
          <div className="vocabulary-flashcard-face vocabulary-flashcard-face--back">
            <span className="vocabulary-flashcard-meaning">{current.meaningVi}</span>
            <span className="vocabulary-flashcard-word-sub">{current.wordEn}</span>
          </div>
        </div>
      </button>

      <div className="vocabulary-flashcard-nav">
        <button
          type="button"
          className="vocabulary-flashcard-nav-btn"
          onClick={handlePrev}
          disabled={index === 0}
          aria-label="Thẻ trước"
        >
          <ChevronLeftIcon />
          Trước
        </button>
        <button
          type="button"
          className="vocabulary-flashcard-nav-btn"
          onClick={handleNext}
          disabled={index >= total - 1}
          aria-label="Thẻ sau"
        >
          Sau
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
