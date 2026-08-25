import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Button, Typography } from "@mui/material";
import type { ReactNode } from "react";
import "../../styles/exam-take.css";

export type ExamNavCellStatus = "todo" | "done" | "current" | "flagged";

type ExamTakeShellProps = {
  examTitle: string;
  remainingLabel?: string | null;
  answeredCount: number;
  totalCount: number;
  /** unitIndex → status (current overrides) */
  cellStatus: (unitIndex: number) => ExamNavCellStatus;
  onJump: (unitIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  flagged: boolean;
  canPrev: boolean;
  canNext: boolean;
  onSubmit: () => void;
  onExit: () => void;
  sectionTitle?: string;
  instruction?: string;
  children: ReactNode;
};

export function ExamTakeShell({
  examTitle,
  remainingLabel,
  answeredCount,
  totalCount,
  cellStatus,
  onJump,
  onPrev,
  onNext,
  onToggleFlag,
  flagged,
  canPrev,
  canNext,
  onSubmit,
  onExit,
  sectionTitle,
  instruction,
  children,
}: ExamTakeShellProps) {
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="exam-take">
      <header className="exam-take-header">
        <button type="button" className="exam-take-exit" onClick={onExit}>
          ← Thoát
        </button>
        <h1 className="exam-take-title">{examTitle}</h1>
        <div className="exam-take-header-actions">
          {remainingLabel ? (
            <div className="exam-take-timer">
              <span className="exam-take-timer-label">Thời gian còn lại</span>
              <strong>{remainingLabel}</strong>
            </div>
          ) : null}
          <Button
            variant="contained"
            startIcon={<LockOutlinedIcon />}
            onClick={onSubmit}
            className="exam-take-submit exam-take-submit--header"
          >
            Nộp bài
          </Button>
        </div>
      </header>

      <div className="exam-take-body">
        <aside className="exam-take-sidebar">
          <div className="exam-take-progress-card">
            <div className="exam-take-progress-head">
              <span>Tiến độ bài làm</span>
              <strong>
                {answeredCount}/{totalCount} câu
              </strong>
            </div>
            <div className="exam-take-progress-track">
              <div className="exam-take-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="exam-take-nav-card">
            <Typography className="exam-take-nav-heading">Danh sách câu hỏi</Typography>
            <div className="exam-take-grid">
              {Array.from({ length: totalCount }, (_, unitIndex) => {
                const status = cellStatus(unitIndex);
                const n = unitIndex + 1;
                return (
                  <button
                    key={unitIndex}
                    type="button"
                    className={`exam-take-cell is-${status}`}
                    onClick={() => onJump(unitIndex)}
                    aria-label={`Câu ${n}`}
                    aria-current={status === "current" ? "true" : undefined}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="exam-take-legend">
            <span>
              <i className="exam-take-dot is-todo" /> Chưa làm
            </span>
            <span>
              <i className="exam-take-dot is-done" /> Đã làm
            </span>
            <span>
              <i className="exam-take-dot is-current" /> Đang xem
            </span>
            <span>
              <i className="exam-take-dot is-flagged" /> Cần xem lại
            </span>
          </div>
        </aside>

        <main className="exam-take-main">
          <div className="exam-take-main-card">
            <div className="exam-take-main-scroll">
              {sectionTitle ? (
                <div className="exam-take-section-head">
                  <AssignmentOutlinedIcon sx={{ fontSize: 18, color: "#6366F1" }} />
                  <h2>{sectionTitle}</h2>
                </div>
              ) : null}
              {instruction ? <p className="exam-take-instruction">{instruction}</p> : null}
              <div className="exam-take-question-body">{children}</div>
            </div>

            <div className="exam-take-q-nav">
              <Button
                variant="outlined"
                disabled={!canPrev}
                onClick={onPrev}
                className="exam-take-q-nav-btn"
              >
                ← Câu trước
              </Button>
              <Button
                variant="outlined"
                onClick={onToggleFlag}
                startIcon={flagged ? <BookmarkOutlinedIcon /> : <BookmarkBorderOutlinedIcon />}
                className={`exam-take-q-nav-btn${flagged ? " is-flagged" : ""}`}
              >
                Đánh dấu
              </Button>
              <Button
                variant="contained"
                disabled={!canNext}
                onClick={onNext}
                className="exam-take-q-nav-btn exam-take-q-nav-btn--primary"
              >
                Câu tiếp theo →
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
