import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { MatchingQuestion as MatchingQuestionType } from "./types";

type MatchingQuestionProps = {
  question: MatchingQuestionType;
  selections: Record<string, string>;
  activeLeft: string | null;
  disabled?: boolean;
  showResult?: boolean;
  onSelectLeft: (left: string) => void;
  onSelectRight: (right: string) => void;
  onReset: () => void;
};

export function MatchingQuestion({
  question,
  selections,
  activeLeft,
  disabled = false,
  showResult = false,
  onSelectLeft,
  onSelectRight,
  onReset,
}: MatchingQuestionProps) {
  const leftItems = question.pairs.map((pair) => pair.left);
  const rightItems = question.rightDisplayOrder ?? question.pairs.map((pair) => pair.right);
  const correctByLeft = Object.fromEntries(question.pairs.map((pair) => [pair.left, pair.right]));
  const pairedCount = Object.keys(selections).length;
  const canReset = !showResult && !disabled && (pairedCount > 0 || activeLeft !== null);

  const rightUsedBy = (right: string): string | null => {
    for (const [left, value] of Object.entries(selections)) {
      if (value === right) return left;
    }
    return null;
  };

  return (
    <div className="exercise-matching">
      {!showResult ? (
        <div className="exercise-matching-toolbar">
          <button
            type="button"
            className="exercise-matching-reset"
            disabled={!canReset}
            title="Chọn lại từ đầu"
            aria-label="Chọn lại từ đầu"
            onClick={onReset}
          >
            <RestartAltIcon className="exercise-matching-reset-icon" />
          </button>
        </div>
      ) : null}

      <div className="exercise-matching-board">
        <div className="exercise-matching-col exercise-matching-col--left">
          {leftItems.map((left, index) => {
            const pairedRight = selections[left];
            const isActive = activeLeft === left;
            const isCorrect = showResult && pairedRight === correctByLeft[left];
            const isWrong =
              showResult && (!pairedRight || pairedRight !== correctByLeft[left]);

            let stateClass = "";
            if (showResult) {
              if (isCorrect) stateClass = " is-correct";
              else if (isWrong) stateClass = " is-wrong";
            } else if (isActive) {
              stateClass = " is-active";
            } else if (pairedRight) {
              stateClass = " is-paired";
            }

            return (
              <button
                key={left}
                type="button"
                className={`exercise-matching-item exercise-matching-item--left${stateClass}`}
                disabled={disabled || showResult}
                onClick={() => onSelectLeft(left)}
              >
                <span className="exercise-matching-item-num">{index + 1}</span>
                <span className="exercise-matching-item-text">{left}</span>
                {showResult && isCorrect ? (
                  <CheckCircleIcon className="exercise-matching-item-icon exercise-matching-item-icon--ok" />
                ) : null}
                {showResult && isWrong ? (
                  <CloseIcon className="exercise-matching-item-icon exercise-matching-item-icon--wrong" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="exercise-matching-col exercise-matching-col--right">
          {rightItems.map((right, index) => {
            const linkedLeft = rightUsedBy(right);
            const isCorrect =
              showResult && linkedLeft !== null && correctByLeft[linkedLeft] === right;
            const isWrong =
              showResult && (linkedLeft === null || correctByLeft[linkedLeft] !== right);

            let stateClass = "";
            if (showResult) {
              if (isCorrect) stateClass = " is-correct";
              else if (isWrong) stateClass = " is-wrong";
            } else if (linkedLeft) {
              stateClass = " is-paired";
            } else if (activeLeft) {
              stateClass = " is-targetable";
            }

            return (
              <button
                key={right}
                type="button"
                className={`exercise-matching-item exercise-matching-item--right${stateClass}`}
                disabled={disabled || showResult || !activeLeft}
                onClick={() => onSelectRight(right)}
              >
                <span className="exercise-matching-item-num">{index + 1}</span>
                <span className="exercise-matching-item-text">{right}</span>
                {showResult && isCorrect ? (
                  <CheckCircleIcon className="exercise-matching-item-icon exercise-matching-item-icon--ok" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
