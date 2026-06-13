import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import { IconButton } from "@mui/material";
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
  const showPool = poolIds.length > 0 || showResult;

  return (
    <div className="exercise-reorder">
      <p className="exercise-reorder-prompt">{promptText}</p>

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
          <IconButton
            type="button"
            className="exercise-reorder-clear"
            disabled={disabled}
            onClick={onClear}
            aria-label="Xóa hết"
            size="small"
          >
            <RestartAltOutlinedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </div>
      ) : null}

      {showPool ? (
        <div className="exercise-reorder-pool">
          <div className="exercise-reorder-pool-chips">
            {poolIds.map((tokenId) => {
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
            })}
          </div>
        </div>
      ) : null}

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
