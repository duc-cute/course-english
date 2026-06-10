import { compareTypedAnswers } from "../../../shared/lesson/answerNormalize";
import { parseFillBlankPrompt } from "../../../shared/lesson/fillBlankUtils";
import type { FillBlankQuestion as FillBlankType } from "./types";

type FillBlankQuestionProps = {
  question: FillBlankType;
  answers: Record<string, string>;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onChange: (blankId: string, value: string) => void;
};

export function FillBlankQuestion({
  question,
  answers,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onChange,
}: FillBlankQuestionProps) {
  const promptText = question.prompt?.text ?? "";
  const segments = parseFillBlankPrompt(promptText, question.blanks);
  const hasRenderableSentence = segments.some(
    (segment) => segment.kind === "text" && segment.value.trim().length > 0,
  );

  const blankResults: Record<string, boolean> = {};
  if (showResult) {
    for (const blank of question.blanks) {
      const user = answers[blank.id] ?? "";
      const accepted = blank.acceptedAnswers.filter((a) => a.trim());
      blankResults[blank.id] = accepted.some((answer) =>
        compareTypedAnswers(user, answer, { caseSensitive: question.caseSensitive }),
      );
    }
  }

  return (
    <div className="exercise-fill-blank">
      <p className="exercise-fill-blank-instruction">Điền từ vào chỗ trống</p>
      {!hasRenderableSentence && promptText.trim() ? (
        <p className="exercise-fill-blank-fallback">{promptText}</p>
      ) : null}
      <div className={`exercise-fill-blank-sentence${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}`}>
        {segments.map((segment, index) => {
          if (segment.kind === "text") {
            return (
              <span key={`t-${index}`} className="exercise-fill-blank-text">
                {segment.value}
              </span>
            );
          }

          const blank = question.blanks.find((b) => b.id === segment.blankId);
          const blankCorrect = blankResults[segment.blankId];
          const value = answers[segment.blankId] ?? "";

          return (
            <input
              key={`b-${segment.blankId}-${index}`}
              type="text"
              className={`exercise-fill-blank-input${
                showResult ? (blankCorrect ? " is-correct" : " is-wrong") : ""
              }`}
              value={value}
              disabled={disabled || showResult}
              placeholder={blank?.placeholder?.trim() || "…"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => onChange(segment.blankId, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
          );
        })}
      </div>
      {showResult ? (
        <p className="exercise-fill-blank-reveal">
          Đáp án:{" "}
          <strong>
            {question.blanks
              .map((b) => b.acceptedAnswers.filter((a) => a.trim())[0] ?? "—")
              .join(" · ")}
          </strong>
        </p>
      ) : null}
    </div>
  );
}
