import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

type ConnectorLine = {
  key: string;
  d: string;
  color: string;
  tone: "paired" | "correct" | "wrong";
};

const PAIR_COLORS = ["#7c3aed", "#2563eb", "#db2777", "#ea580c", "#16a34a", "#0891b2"] as const;

function letterLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

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
  const leftItems = useMemo(() => question.pairs.map((pair) => pair.left), [question.pairs]);
  const rightItems = useMemo(
    () => question.rightDisplayOrder ?? question.pairs.map((pair) => pair.right),
    [question.pairs, question.rightDisplayOrder],
  );
  const correctByLeft = useMemo(
    () => Object.fromEntries(question.pairs.map((pair) => [pair.left, pair.right])),
    [question.pairs],
  );
  const leftColorByKey = useMemo(() => {
    const map: Record<string, string> = {};
    leftItems.forEach((left, index) => {
      map[left] = PAIR_COLORS[index % PAIR_COLORS.length]!;
    });
    return map;
  }, [leftItems]);

  const pairedCount = Object.keys(selections).length;
  const canReset = !showResult && !disabled && (pairedCount > 0 || activeLeft !== null);

  const boardRef = useRef<HTMLDivElement>(null);
  const leftAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const rightAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [lines, setLines] = useState<ConnectorLine[]>([]);

  const rightUsedBy = (right: string): string | null => {
    for (const [left, value] of Object.entries(selections)) {
      if (value === right) return left;
    }
    return null;
  };

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const measure = () => {
      const boardRect = board.getBoundingClientRect();
      const next: ConnectorLine[] = [];

      for (const [left, right] of Object.entries(selections)) {
        const leftEl = leftAnchorRefs.current[left];
        const rightEl = rightAnchorRefs.current[right];
        if (!leftEl || !rightEl) continue;

        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        const x1 = leftRect.left + leftRect.width / 2 - boardRect.left;
        const y1 = leftRect.top + leftRect.height / 2 - boardRect.top;
        const x2 = rightRect.left + rightRect.width / 2 - boardRect.left;
        const y2 = rightRect.top + rightRect.height / 2 - boardRect.top;

        const isCorrect = correctByLeft[left] === right;
        let tone: ConnectorLine["tone"] = "paired";
        let color = leftColorByKey[left] ?? PAIR_COLORS[0];
        if (showResult) {
          tone = isCorrect ? "correct" : "wrong";
          color = isCorrect ? "#16a34a" : "#dc2626";
        }

        next.push({
          key: `${left}__${right}`,
          d: bezierPath(x1, y1, x2, y2),
          color,
          tone,
        });
      }

      setLines(next);
    };

    measure();
    const raf = window.requestAnimationFrame(() => measure());

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(board);
    const cols = board.querySelectorAll(".exercise-matching-col");
    cols.forEach((col) => resizeObserver.observe(col));
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [selections, showResult, correctByLeft, leftColorByKey, leftItems, rightItems]);

  return (
    <div className="exercise-matching">
      <div className="exercise-matching-meta">
        <p className="exercise-matching-meta__count">
          {pairedCount} / {leftItems.length} đã nối
        </p>
        {!showResult ? (
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
        ) : null}
      </div>

      <div className="exercise-matching-board" ref={boardRef}>
        <svg className="exercise-matching-lines" aria-hidden>
          {lines.map((line) => (
            <path
              key={line.key}
              d={line.d}
              className={`exercise-matching-line is-${line.tone}`}
              stroke={line.color}
              fill="none"
            />
          ))}
        </svg>

        <div className="exercise-matching-col exercise-matching-col--left">
          <span className="exercise-matching-col__label">Thành ngữ</span>
          {leftItems.map((left, index) => {
            const pairedRight = selections[left];
            const isActive = activeLeft === left;
            const isCorrect = showResult && pairedRight === correctByLeft[left];
            const isWrong =
              showResult && (!pairedRight || pairedRight !== correctByLeft[left]);
            const pairColor = leftColorByKey[left];

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
                style={
                  pairedRight && !showResult
                    ? ({ ["--match-pair-color" as string]: pairColor } as CSSProperties)
                    : isActive
                      ? ({ ["--match-pair-color" as string]: pairColor } as CSSProperties)
                      : undefined
                }
                disabled={disabled || showResult}
                onClick={() => onSelectLeft(left)}
              >
                <span className="exercise-matching-item-num">{index + 1}</span>
                <span className="exercise-matching-item-text">{left}</span>
                <span
                  className="exercise-matching-anchor exercise-matching-anchor--left"
                  style={
                    pairedRight || isActive
                      ? { background: showResult ? undefined : pairColor, borderColor: showResult ? undefined : pairColor }
                      : undefined
                  }
                  ref={(el) => {
                    leftAnchorRefs.current[left] = el;
                  }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <div className="exercise-matching-col exercise-matching-col--right">
          <span className="exercise-matching-col__label">Nghĩa</span>
          {rightItems.map((right, index) => {
            const linkedLeft = rightUsedBy(right);
            const isCorrect =
              showResult && linkedLeft !== null && correctByLeft[linkedLeft] === right;
            const isWrong =
              showResult && (linkedLeft === null || correctByLeft[linkedLeft] !== right);
            const pairColor = linkedLeft ? leftColorByKey[linkedLeft] : undefined;

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
                style={
                  linkedLeft && !showResult
                    ? ({ ["--match-pair-color" as string]: pairColor } as CSSProperties)
                    : undefined
                }
                disabled={disabled || showResult || !activeLeft}
                onClick={() => onSelectRight(right)}
              >
                <span
                  className="exercise-matching-anchor exercise-matching-anchor--right"
                  style={
                    linkedLeft
                      ? { background: showResult ? undefined : pairColor, borderColor: showResult ? undefined : pairColor }
                      : undefined
                  }
                  ref={(el) => {
                    rightAnchorRefs.current[right] = el;
                  }}
                  aria-hidden
                />
                <span className="exercise-matching-item-num">{letterLabel(index)}</span>
                <span className="exercise-matching-item-text">{right}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
