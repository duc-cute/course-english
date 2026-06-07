import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import { ConfettiCelebration } from "./ConfettiCelebration";
import {
  buildPracticeSubtitle,
  buildQuestionRefNote,
  formatElapsedTime,
} from "./exerciseResultUtils";

type ExerciseResultScreenProps = {
  lessonTitle: string;
  subjectName?: string;
  practiceBlocks: LessonBlockRecord[];
  correctCount: number;
  total: number;
  passScorePercent: number;
  elapsedMs: number;
  passed: boolean;
  nextLessonTitle?: string;
  onReview: () => void;
  onRetry: () => void;
  onContinueStudy?: () => void;
  onBackToLessons?: () => void;
};

const TEACHER_PASS_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBkIIZT4EK5nmGo7y6EKx4cLz7dHpiMZnbeuIj3gEqq6NZ6gVHs3fWsWoZMUSGj0swik5AqVus5Nis2EXFZmLtY5WPx_6OBoiso1avUp1zQFSDZIubtuvYHL2-cOuJT0BvcRmJIdqqMeuHyTU6wT1-R-PC0od1tWFGrIVtBjkB7jCaOGAbwHjWw5RkGGSaTvD4hFCvRV_5h4iQTIunOm45a227YzH0VamOQ3fe8peYLPCn-ku0r5HhvIx2PEcsm9lGgfBXKYItzDjo";

const TEACHER_FAIL_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAF0GVj9_XiV-cqgA-7U68XA0Fh8oq_p0du7wza1_AX15YQaH9UBk8n7MQgAj0dKxfqzBP41aCD47B0173N5errIAN-PJQpIMtyZGKwZeEcQSFD-INdeNU1iY3MGb2TkuPVBhYxWFBQnnQ0scg05vRKYNC4VvziWvjAKBJdq_7qNNYg1keUH2dyX-3HyrIDIZdq6qiHqqRvzKjoHrdkHlo2dC8FRHi8v4lI_W2_UbqKm6unrjVfpifcKIP-y27onnRu1YValySmHDo";

export function ExerciseResultScreen({
  lessonTitle,
  subjectName,
  practiceBlocks,
  correctCount,
  total,
  passScorePercent,
  elapsedMs,
  passed,
  nextLessonTitle,
  onReview,
  onRetry,
  onContinueStudy,
  onBackToLessons,
}: ExerciseResultScreenProps) {
  const wrongCount = total - correctCount;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const requiredCorrect = total > 0 ? Math.ceil((total * passScorePercent) / 100) : 0;
  const questionsStillNeeded = Math.max(0, requiredCorrect - correctCount);
  const correctPct = total > 0 ? (correctCount / total) * 100 : 0;

  const subtitle = buildPracticeSubtitle(practiceBlocks, total);
  const refNote = buildQuestionRefNote(practiceBlocks);

  return (
    <div className={`exercise-result${passed ? " exercise-result--pass" : " exercise-result--fail"}`}>
      {passed ? <ConfettiCelebration /> : null}
      <div className="exercise-result-grid">
        <aside className="exercise-result-sidebar">
          {onBackToLessons ? (
            <button type="button" className="exercise-result-sidebar-back" onClick={onBackToLessons}>
              <ArrowBackIcon sx={{ fontSize: 18 }} />
              Quay lại danh sách bài học
            </button>
          ) : null}

          <div className="exercise-result-lesson-head">
            <div className="exercise-result-badges">
              <span className="exercise-result-badge exercise-result-badge--primary">
                <MenuBookOutlinedIcon sx={{ fontSize: 14 }} />
                BÀI TẬP
              </span>
              {subjectName ? (
                <span className="exercise-result-badge exercise-result-badge--subject">{subjectName.toUpperCase()}</span>
              ) : null}
            </div>
            <h2 className="exercise-result-lesson-title">{lessonTitle}</h2>
            {subtitle ? <p className="exercise-result-lesson-sub">{subtitle}</p> : null}
          </div>

          {refNote ? <div className="exercise-result-ref-note">{refNote}</div> : null}

          <div className="exercise-result-circle-wrap">
            <div
              className="exercise-result-circle"
              style={
                wrongCount > 0
                  ? {
                      background: `conic-gradient(#4ade80 ${correctPct}%, #f87171 ${correctPct}% 100%)`,
                    }
                  : {
                      background: `conic-gradient(#4ade80 ${correctPct}%, #e5e7eb 0)`,
                    }
              }
            >
              <div className="exercise-result-circle-inner">
                <span className="exercise-result-circle-score">
                  {correctCount}/{total}
                </span>
                <span className="exercise-result-circle-label">CÂU ĐÚNG</span>
              </div>
              {passed ? (
                <span className="exercise-result-circle-star" aria-hidden>
                  <StarOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />
                </span>
              ) : null}
            </div>
          </div>

          <ul className="exercise-result-stats">
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--ok">
                  <CheckIcon sx={{ fontSize: 16 }} />
                </span>
                Câu đúng
              </span>
              <span className="exercise-result-stat-value">{correctCount}</span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--wrong">
                  <CloseIcon sx={{ fontSize: 16 }} />
                </span>
                Câu sai
              </span>
              <span className="exercise-result-stat-value">{wrongCount}</span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--time">
                  <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
                </span>
                Thời gian làm bài
              </span>
              <span className="exercise-result-stat-value">{formatElapsedTime(elapsedMs)}</span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--score">
                  <StarOutlinedIcon sx={{ fontSize: 16 }} />
                </span>
                Điểm số
              </span>
              <span className="exercise-result-stat-value exercise-result-stat-value--score">
                {scorePct}%
                <span className="exercise-result-stat-hint"> (Đạt {passScorePercent}% là qua)</span>
              </span>
            </li>
          </ul>

          {passed ? (
            <div className="exercise-result-toast exercise-result-toast--ok">
              <EmojiEventsOutlinedIcon sx={{ fontSize: 22, color: "#15803d" }} />
              <div>
                <p className="exercise-result-toast-title">Tuyệt vời! Bạn đã hoàn thành bài tập.</p>
                <p className="exercise-result-toast-sub">Giữ vững phong độ nhé!</p>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="exercise-result-main">
          <div className={`exercise-result-hero${passed ? " exercise-result-hero--pass" : " exercise-result-hero--fail"}`}>
            <div className={`exercise-result-status-icon${passed ? " is-pass" : " is-fail"}`}>
              {passed ? (
                <CheckIcon sx={{ fontSize: 48 }} />
              ) : (
                <CloseIcon sx={{ fontSize: 48 }} />
              )}
            </div>

            <div className="exercise-result-hero-text">
              <h2 className="exercise-result-hero-title">
                {passed ? "Chúc mừng!" : "Chưa đạt — thử lại nhé!"}
              </h2>
              {passed ? (
                <>
                  <p className="exercise-result-hero-sub">Bạn đã hoàn thành bài tập xuất sắc!</p>
                  <p className="exercise-result-hero-pill">
                    <StarOutlinedIcon sx={{ fontSize: 18, color: "#facc15" }} />
                    Bạn đã trả lời đúng {correctCount === total ? "tất cả" : `${correctCount}`} {total} câu hỏi.
                  </p>
                </>
              ) : (
                <>
                  <p className="exercise-result-hero-score">
                    {correctCount} / {total} câu đúng
                  </p>
                  <p className="exercise-result-hero-hint">
                    Cần đúng ít nhất <strong>{requiredCorrect} câu</strong> — bạn cần thêm{" "}
                    <strong>{questionsStillNeeded} câu nữa</strong>.
                  </p>
                </>
              )}
            </div>

            <div className="exercise-result-mascot">
              <img
                src={passed ? TEACHER_PASS_IMG : TEACHER_FAIL_IMG}
                alt=""
                className="exercise-result-mascot-img"
              />
            </div>

            {!passed ? (
              <div className="exercise-result-tip">
                <span aria-hidden>💡</span>
                <p>
                  <strong>Mẹo nhỏ:</strong> Xem lại bài học và luyện thêm những từ vựng còn sai nhé!
                </p>
              </div>
            ) : null}

            <div className="exercise-result-actions">
              <button type="button" className="exercise-result-btn exercise-result-btn--outline" onClick={onReview}>
                <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                Xem lại bài làm
              </button>
              <button type="button" className="exercise-result-btn exercise-result-btn--outline" onClick={onRetry}>
                <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
                Làm lại
              </button>
              {onContinueStudy ? (
                <button
                  type="button"
                  className={`exercise-result-btn exercise-result-btn--primary${passed ? " is-pass" : ""}`}
                  onClick={onContinueStudy}
                >
                  <span className="exercise-result-btn-label">
                    {nextLessonTitle ? "Bài tiếp theo" : "Học tiếp bài học"}
                    {nextLessonTitle ? (
                      <span className="exercise-result-btn-sub">{nextLessonTitle}</span>
                    ) : null}
                  </span>
                  <ArrowForwardIcon sx={{ fontSize: 20, flexShrink: 0 }} />
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
