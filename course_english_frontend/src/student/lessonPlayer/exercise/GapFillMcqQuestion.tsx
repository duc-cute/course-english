import {
  parseFillBlankPrompt,
  scoreGapFillMcq,
} from "../../../shared/lesson/gapFillMcqUtils";
import type { GapFillMcqQuestion as GapFillMcqType } from "./types";

type GapFillMcqQuestionProps = {
  question: GapFillMcqType;
  answers: Record<string, string>;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onChange: (blankId: string, choiceId: string) => void;
};

export function GapFillMcqQuestion({
  question,
  answers,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onChange,
}: GapFillMcqQuestionProps) {
  const promptText = question.prompt?.text ?? "";
  const segments = parseFillBlankPrompt(promptText, question.blanks);
  const hasRenderableSentence = segments.some(
    (segment) => segment.kind === "text" && segment.value.trim().length > 0,
  );

  const scored = showResult ? scoreGapFillMcq(question.blanks, answers) : null;

  return (
    <div className="exercise-gap-fill-mcq">
      {!hasRenderableSentence && promptText.trim() ? (
        <p className="exercise-gap-fill-mcq-fallback">{promptText}</p>
      ) : null}
      <div
        className={`exercise-gap-fill-mcq-sentence${
          showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""
        }`}
      >
        {segments.map((segment, index) => {
          if (segment.kind === "text") {
            return (
              <span key={`t-${index}`} className="exercise-gap-fill-mcq-text">
                {segment.value}
              </span>
            );
          }

          const blank = question.blanks.find((b) => b.id === segment.blankId);
          const blankCorrect = scored?.perBlank[segment.blankId];
          const value = answers[segment.blankId] ?? "";
          const isEmpty = !value;

          return (
            <span key={`b-${segment.blankId}-${index}`} className="exercise-gap-fill-mcq-blank">
              <select
                className={`exercise-gap-fill-mcq-select${
                  isEmpty ? " is-empty" : " is-filled"
                }${showResult ? (blankCorrect ? " is-correct" : " is-wrong") : ""}`}
                value={value}
                disabled={disabled || showResult}
                onChange={(e) => onChange(segment.blankId, e.target.value)}
              >
                <option value="" disabled hidden>
                  …
                </option>
                {(blank?.choices ?? []).map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.text}
                  </option>
                ))}
              </select>
            </span>
          );
        })}
      </div>
      {showResult ? (
        <p className="exercise-gap-fill-mcq-reveal">
          Đúng {scored?.correctBlankCount ?? 0}/{scored?.totalBlanks ?? 0} ô · Đáp án:{" "}
          <strong>
            {question.blanks
              .map((b) => b.choices.find((c) => c.id === b.correctChoiceId)?.text ?? "—")
              .join(" · ")}
          </strong>
        </p>
      ) : null}
    </div>
  );
}
