import {
  MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
  resolveMcqArrangementView,
} from "../../../shared/lesson/mcqArrangementUtils";
import type { MultipleChoiceQuestion as McqType } from "./types";

const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F"] as const;

type MultipleChoiceQuestionProps = {
  question: McqType;
  selectedId: string | null;
  disabled?: boolean;
  showResult?: boolean;
  onSelect: (choiceId: string) => void;
};

export function MultipleChoiceQuestion({
  question,
  selectedId,
  disabled = false,
  showResult = false,
  onSelect,
}: MultipleChoiceQuestionProps) {
  const arrangement = resolveMcqArrangementView(question);
  const answeredWrong = showResult && selectedId !== question.correctChoiceId;
  const useExamLayout = arrangement.isArrangement;

  return (
    <div
      className={`exercise-mcq${useExamLayout ? " exercise-mcq--arrangement" : ""}`}
      data-layout={useExamLayout ? MCQ_LAYOUT_SENTENCE_ARRANGEMENT : undefined}
    >
      {useExamLayout ? (
        <>
          {arrangement.stem ? (
            <p className="exercise-mcq-arrangement-stem">{arrangement.stem}</p>
          ) : null}
          <ol className="exercise-mcq-arrangement-items">
            {arrangement.items.map((item) => (
              <li key={item.key} className="exercise-mcq-arrangement-item">
                <span className="exercise-mcq-arrangement-item-key">{item.key}.</span>
                <span className="exercise-mcq-arrangement-item-text">{item.text}</span>
              </li>
            ))}
          </ol>
          <p className="exercise-mcq-arrangement-q-label">Chọn thứ tự đúng</p>
        </>
      ) : (
        <p className="exercise-mcq-prompt">{question.prompt.text}</p>
      )}

      <div className={`exercise-mcq-grid${useExamLayout ? " exercise-mcq-grid--exam" : ""}`}>
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

          const label = useExamLayout
            ? (CHOICE_LABELS[index] ?? choice.id.toUpperCase())
            : String(index + 1);

          return (
            <button
              key={choice.id}
              type="button"
              className={`exercise-mcq-option${stateClass}`}
              disabled={disabled || showResult}
              onClick={() => onSelect(choice.id)}
            >
              <span className="exercise-mcq-option-num">{label}</span>
              <span className="exercise-mcq-option-text">{choice.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
