import type { SpellingQuestion as SpellingType } from "./types";

type SpellingQuestionProps = {
  question: SpellingType;
  value: string;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onChange: (value: string) => void;
};

export function SpellingQuestion({
  question,
  value,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onChange,
}: SpellingQuestionProps) {
  const promptText = question.prompt?.text?.trim() || "Gõ từ tiếng Anh";

  return (
    <div className="exercise-typed">
      <p className="exercise-typed-prompt">{promptText}</p>
      {question.hint?.trim() && !showResult ? (
        <p className="exercise-typed-hint">
          Gợi ý: <strong>{question.hint}</strong>
        </p>
      ) : null}
      <input
        type="text"
        className={`exercise-typed-input${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}`}
        value={value}
        disabled={disabled || showResult}
        placeholder="Nhập từ tiếng Anh..."
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
          Đáp án: <strong>{question.wordEn}</strong>
        </p>
      ) : null}
    </div>
  );
}
