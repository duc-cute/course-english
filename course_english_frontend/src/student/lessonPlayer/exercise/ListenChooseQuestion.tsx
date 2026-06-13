import { useEffect } from "react";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import type { ListenChooseQuestion as ListenChooseType } from "./types";

type ListenChooseQuestionProps = {
  question: ListenChooseType;
  selectedId: string | null;
  disabled?: boolean;
  showResult?: boolean;
  onSelect: (choiceId: string) => void;
};

function playAudio(url: string) {
  const audio = new Audio(url);
  void audio.play().catch(() => {
    /* autoplay policy or missing file */
  });
}

export function ListenChooseQuestion({
  question,
  selectedId,
  disabled = false,
  showResult = false,
  onSelect,
}: ListenChooseQuestionProps) {
  const answeredWrong = showResult && selectedId !== question.correctChoiceId;
  const accentLabel = question.audioAccent === "US" ? "US" : "UK";

  useEffect(() => {
    if (showResult || !question.audioUrl) return;
    playAudio(question.audioUrl);
  }, [question.id, question.audioUrl, showResult]);

  return (
    <div className="exercise-listen">
      <button
        type="button"
        className="exercise-listen-play"
        onClick={() => playAudio(question.audioUrl)}
        disabled={disabled && showResult}
        aria-label={`Nghe phát âm ${accentLabel}`}
      >
        <VolumeUpOutlinedIcon sx={{ fontSize: 28 }} />
        <span>Nghe ({accentLabel})</span>
      </button>
      {showResult && question.wordEn ? (
        <p className="exercise-listen-reveal">
          Từ: <strong>{question.wordEn}</strong>
        </p>
      ) : null}
      <div className="exercise-mcq-grid exercise-listen-choices">
        {question.choices.map((choice, index) => {
          const isSelected = selectedId === choice.id;
          const isCorrect = choice.id === question.correctChoiceId;
          let stateClass = "";

          if (showResult) {
            if (isCorrect && (isSelected || answeredWrong)) {
              stateClass = " is-correct";
            } else if (isSelected && !isCorrect) {
              stateClass = " is-wrong";
            }
          } else if (isSelected) {
            stateClass = " is-selected";
          }

          return (
            <button
              key={choice.id}
              type="button"
              className={`exercise-mcq-option${stateClass}`}
              disabled={disabled || showResult}
              onClick={() => onSelect(choice.id)}
            >
              <span className="exercise-mcq-option-num">{index + 1}</span>
              <span className="exercise-mcq-option-text">{choice.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
