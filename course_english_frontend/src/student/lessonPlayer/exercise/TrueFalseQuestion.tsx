import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  TRUE_FALSE_FALSE_ID,
  TRUE_FALSE_TRUE_ID,
  type TrueFalseQuestion as TrueFalseType,
} from "./types";

type TrueFalseQuestionProps = {
  question: TrueFalseType;
  selectedId: string | null;
  disabled?: boolean;
  showResult?: boolean;
  onSelect: (choiceId: string) => void;
};

const OPTIONS = [
  { id: TRUE_FALSE_TRUE_ID, label: "Đúng", Icon: CheckIcon },
  { id: TRUE_FALSE_FALSE_ID, label: "Sai", Icon: CloseIcon },
] as const;

function correctChoiceId(question: TrueFalseType): string {
  return question.correctAnswer ? TRUE_FALSE_TRUE_ID : TRUE_FALSE_FALSE_ID;
}

export function TrueFalseQuestion({
  question,
  selectedId,
  disabled = false,
  showResult = false,
  onSelect,
}: TrueFalseQuestionProps) {
  const correctId = correctChoiceId(question);
  const answeredWrong = showResult && selectedId !== correctId;

  return (
    <div className="exercise-tf">
      <p className="exercise-mcq-prompt">{question.prompt.text}</p>
      <div className="exercise-tf-grid">
        {OPTIONS.map(({ id, label, Icon }) => {
          const isSelected = selectedId === id;
          const isCorrect = id === correctId;
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
              key={id}
              type="button"
              className={`exercise-tf-option${stateClass}`}
              disabled={disabled || showResult}
              onClick={() => onSelect(id)}
            >
              <span className="exercise-tf-option-icon" aria-hidden>
                <Icon sx={{ fontSize: 28 }} />
              </span>
              <span className="exercise-tf-option-text">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { correctChoiceId as trueFalseCorrectChoiceId };
