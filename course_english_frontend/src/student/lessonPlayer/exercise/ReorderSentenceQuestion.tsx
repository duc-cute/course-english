import type { ReorderSentenceQuestion as ReorderType } from "./types";
import { getPoolTokenIds, getTokenById } from "../../../shared/lesson/reorderSentenceUtils";

type ReorderSentenceQuestionProps = {
  question: ReorderType;
  selectedOrder: string[];
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onTapPool: (tokenId: string) => void;
  onTapSentence: (tokenId: string) => void;
  onClear?: () => void;
};

export function ReorderSentenceQuestion({
  question,
  selectedOrder,
  disabled = false,
  showResult = false,
  isCorrect = false,
  onTapPool,
  onTapSentence,
  onClear,
}: ReorderSentenceQuestionProps) {
  const promptText = question.prompt?.text?.trim() || "Sắp xếp các mảnh thành câu đúng";
  const poolIds = getPoolTokenIds(question.tokens, selectedOrder, question.poolDisplayOrder);
  const total = question.tokens.length;
  const placed = selectedOrder.length;

  return (
    <div className="exercise-reorder">
      <p className="exercise-reorder-prompt">{promptText}</p>
      {question.sourceSentence?.trim() ? (
        <p className="exercise-reorder-hint">Gợi ý: {question.sourceSentence.trim()}</p>
      ) : null}

      {!showResult ? (
        <p className="exercise-reorder-meta">
          Đã xếp {placed}/{total} mảnh — bấm từ bên dưới để thêm vào câu
        </p>
      ) : null}

      <div
        className={`exercise-reorder-sentence${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}`}
      >
        {selectedOrder.length === 0 ? (
          <span className="exercise-reorder-placeholder">Câu của bạn sẽ hiện ở đây…</span>
        ) : (
          selectedOrder.map((tokenId, index) => {
            const token = getTokenById(question.tokens, tokenId);
            if (!token) return null;
            const positionCorrect =
              showResult && question.correctOrder[index] === tokenId;
            const positionWrong = showResult && !positionCorrect;
            return (
              <button
                key={`${tokenId}-${index}`}
                type="button"
                className={`exercise-reorder-chip exercise-reorder-chip--sentence${
                  positionCorrect ? " is-correct" : positionWrong ? " is-wrong" : ""
                }`}
                disabled={disabled || showResult}
                onClick={() => onTapSentence(tokenId)}
              >
                {token.text}
              </button>
            );
          })
        )}
      </div>

      {!showResult && selectedOrder.length > 0 && onClear ? (
        <div className="exercise-reorder-actions">
          <button type="button" className="exercise-reorder-clear" disabled={disabled} onClick={onClear}>
            Xóa hết
          </button>
        </div>
      ) : null}

      <div className="exercise-reorder-pool">
        <span className="exercise-reorder-pool-label">Từ còn lại</span>
        <div className="exercise-reorder-pool-chips">
          {poolIds.length === 0 ? (
            <span className="exercise-reorder-pool-empty">
              {showResult ? "—" : "Đã dùng hết mảnh"}
            </span>
          ) : (
            poolIds.map((tokenId) => {
              const token = getTokenById(question.tokens, tokenId);
              if (!token) return null;
              return (
                <button
                  key={tokenId}
                  type="button"
                  className="exercise-reorder-chip exercise-reorder-chip--pool"
                  disabled={disabled || showResult}
                  onClick={() => onTapPool(tokenId)}
                >
                  {token.text}
                </button>
              );
            })
          )}
        </div>
      </div>

      {showResult ? (
        <p className="exercise-reorder-reveal">
          Đáp án:{" "}
          <strong>
            {question.correctOrder
              .map((id) => getTokenById(question.tokens, id)?.text ?? "—")
              .join(" ")}
          </strong>
        </p>
      ) : null}
    </div>
  );
}
