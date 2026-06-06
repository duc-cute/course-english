import type { MultipleChoiceQuestion as McqType } from "./types";

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
  const promptText = question.prompt.text;

  return (
    <div className="exercise-mcq">
      <p className="exercise-mcq-prompt">{promptText}</p>
      <div className="exercise-mcq-grid">
        {question.choices.map((choice, index) => {
          const isSelected = selectedId === choice.id;
          const isCorrect = choice.id === question.correctChoiceId;
          let stateClass = "";
          if (showResult && isSelected && isCorrect) stateClass = " is-correct";
          else if (showResult && isSelected && !isCorrect) stateClass = " is-wrong";
          else if (showResult && !isSelected && isCorrect) stateClass = " is-reveal-correct";
          else if (isSelected) stateClass = " is-selected";

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
