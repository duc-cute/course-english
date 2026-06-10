import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import type { ListenTypeQuestion as ListenTypeQuestionModel } from "./types";

type ListenTypeQuestionProps = {
  question: ListenTypeQuestionModel;
  value: string;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onChange: (value: string) => void;
};

function playAudio(url: string) {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

export function ListenTypeQuestion({
  question,
  value,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onChange,
}: ListenTypeQuestionProps) {
  const accentLabel = question.audioAccent === "US" ? "US" : "UK";
  const promptText = question.prompt?.text?.trim() || "Nghe và gõ từ tiếng Anh";

  return (
    <div className="exercise-typed exercise-listen-type">
      <p className="exercise-typed-prompt">{promptText}</p>
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
      <input
        type="text"
        className={`exercise-typed-input${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}`}
        value={value}
        disabled={disabled || showResult}
        placeholder="Gõ từ bạn nghe được..."
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />
      {showResult && question.wordEn ? (
        <p className="exercise-typed-reveal">
          Từ: <strong>{question.wordEn}</strong>
        </p>
      ) : null}
    </div>
  );
}
