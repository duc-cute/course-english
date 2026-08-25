import {
  buildGapFillMcqPassageSegments,
  GAP_FILL_MCQ_CHOICE_IDS,
  scoreGapFillMcq,
} from "../../../shared/lesson/gapFillMcqUtils";
import type { GapFillMcqQuestion as GapFillMcqType } from "./types";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

type GapFillMcqQuestionProps = {
  question: GapFillMcqType;
  answers: Record<string, string>;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onChange: (blankId: string, choiceId: string) => void;
};

function choiceLabel(choiceId: string, index: number): string {
  const fromId = GAP_FILL_MCQ_CHOICE_IDS.indexOf(choiceId as (typeof GAP_FILL_MCQ_CHOICE_IDS)[number]);
  if (fromId >= 0) return CHOICE_LABELS[fromId]!;
  return CHOICE_LABELS[index] ?? String.fromCharCode(65 + index);
}

export function GapFillMcqQuestion({
  question,
  answers,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onChange,
}: GapFillMcqQuestionProps) {
  const promptText = question.prompt?.text ?? "";
  const segments = buildGapFillMcqPassageSegments(promptText, question.blanks);
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
        className={`exercise-gap-fill-mcq-passage${
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

          const blankOrdinal = question.blanks.findIndex((b) => b.id === segment.blankId) + 1;
          const blank = question.blanks.find((b) => b.id === segment.blankId);
          const selectedId = answers[segment.blankId] ?? "";
          const selectedText = blank?.choices.find((c) => c.id === selectedId)?.text?.trim() ?? "";
          const blankCorrect = scored?.perBlank[segment.blankId];
          const filled = Boolean(selectedText);

          return (
            <span
              key={`b-${segment.blankId}-${index}`}
              className={`exercise-gap-fill-mcq-slot${filled ? " is-filled" : ""}${
                showResult ? (blankCorrect ? " is-correct" : " is-wrong") : ""
              }`}
              aria-label={`Chỗ trống ${blankOrdinal || ""}`}
            >
              <span className="exercise-gap-fill-mcq-slot-num">({blankOrdinal || "?"})</span>
              <span className="exercise-gap-fill-mcq-slot-line">
                {filled ? selectedText : "________"}
              </span>
            </span>
          );
        })}
      </div>

      <ol className="exercise-gap-fill-mcq-questions">
        {question.blanks.map((blank, blankIndex) => {
          const ordinal = blankIndex + 1;
          const selectedId = answers[blank.id] ?? "";
          const blankCorrect = scored?.perBlank[blank.id];

          return (
            <li
              key={blank.id}
              id={`exam-unit-${question.id}-${blank.id}`}
              className="exercise-gap-fill-mcq-question"
            >
              <div className="exercise-gap-fill-mcq-question-label">Question {ordinal}.</div>
              <div
                className="exercise-gap-fill-mcq-options"
                role="radiogroup"
                aria-label={`Question ${ordinal}`}
              >
                {blank.choices.map((choice, choiceIndex) => {
                  const label = choiceLabel(choice.id, choiceIndex);
                  const selected = selectedId === choice.id;
                  const optionClass = [
                    "exercise-gap-fill-mcq-option",
                    selected ? "is-selected" : "",
                    showResult && selected ? (blankCorrect ? "is-correct" : "is-wrong") : "",
                    showResult && choice.id === blank.correctChoiceId ? "is-answer" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={optionClass}
                      disabled={disabled || showResult}
                      onClick={() => onChange(blank.id, choice.id)}
                    >
                      <span className="exercise-gap-fill-mcq-option-key">{label}.</span>
                      <span className="exercise-gap-fill-mcq-option-text">{choice.text}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

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
