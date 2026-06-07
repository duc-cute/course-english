import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import type { MatchingQuestion as MatchingQuestionType } from "./types";

type MatchingQuestionProps = {
  question: MatchingQuestionType;
  selections: Record<string, string>;
  activeLeft: string | null;
  disabled?: boolean;
  showResult?: boolean;
  onSelectLeft: (left: string) => void;
  onSelectRight: (right: string) => void;
};

export function MatchingQuestion({
  question,
  selections,
  activeLeft,
  disabled = false,
  showResult = false,
  onSelectLeft,
  onSelectRight,
}: MatchingQuestionProps) {
  const leftItems = question.pairs.map((pair) => pair.left);
  const rightItems = question.rightDisplayOrder ?? question.pairs.map((pair) => pair.right);
  const correctByLeft = Object.fromEntries(question.pairs.map((pair) => [pair.left, pair.right]));
  const promptText = question.prompt?.text?.trim();
  const totalPairs = question.pairs.length;
  const pairedCount = Object.keys(selections).length;
  const progressPct = totalPairs > 0 ? Math.round((pairedCount / totalPairs) * 100) : 0;

  const rightUsedBy = (right: string): string | null => {
    for (const [left, value] of Object.entries(selections)) {
      if (value === right) return left;
    }
    return null;
  };

  return (
    <div className="exercise-matching">
      {promptText ? <p className="exercise-matching-prompt">{promptText}</p> : null}
      <p className="exercise-matching-hint">
        {showResult
          ? "Kết quả ghép cặp"
          : "Chọn từ bên trái, rồi chọn nghĩa tương ứng bên phải"}
      </p>

      {!showResult ? (
        <div className="exercise-matching-progress">
          <div className="exercise-matching-progress-head">
            <span className="exercise-matching-progress-label">Tiến độ ghép cặp</span>
            <span className="exercise-matching-progress-count">
              {pairedCount}/{totalPairs} cặp
            </span>
          </div>
          <div className="exercise-matching-progress-track">
            <div
              className="exercise-matching-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="exercise-matching-board">
        <div className="exercise-matching-col">
          <span className="exercise-matching-col-label">Tiếng Anh</span>
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

        <div className="exercise-matching-col">
          <span className="exercise-matching-col-label">Tiếng Việt</span>
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
