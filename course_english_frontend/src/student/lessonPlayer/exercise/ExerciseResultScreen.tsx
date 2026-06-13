import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { ConfettiCelebration } from "./ConfettiCelebration";
import {
  buildPracticeSubtitle,
  formatElapsedTime,
} from "./exerciseResultUtils";

const EXERCISE_RESULT_MASCOT_PASS = "/images/exercise-result/pass.png";
const EXERCISE_RESULT_MASCOT_FAIL = "/images/exercise-result/sad.png";

type ExerciseResultScreenProps = {
  lessonTitle: string;
  subjectName?: string;
  correctCount: number;
  total: number;
  wrongCount?: number;
  passScorePercent: number;
  elapsedMs: number;
  passed: boolean;
  isWrongOnlyRetry?: boolean;
  nextLessonTitle?: string;
  onReview: () => void;
  onRetry: () => void;
  onContinueStudy?: () => void;
  onBackToLessons?: () => void;
};

export function ExerciseResultScreen({
  lessonTitle,
  subjectName,
  correctCount,
  total,
  wrongCount: wrongCountProp,
  passScorePercent,
  elapsedMs,
  passed,
  isWrongOnlyRetry = false,
  nextLessonTitle,
  onReview,
  onRetry,
  onContinueStudy,
  onBackToLessons,
}: ExerciseResultScreenProps) {
  const wrongCount = wrongCountProp ?? total - correctCount;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const subtitle = buildPracticeSubtitle(total);

  const circleBackground = passed
    ? `conic-gradient(#22c55e ${scorePct}%, #e5e7eb ${scorePct}%)`
    : `conic-gradient(#22c55e ${scorePct}%, #f87171 ${scorePct}%)`;

  return (
    <div
      className={`exercise-result exercise-result--${passed ? "pass" : "fail"}`}
    >
      {passed ? <ConfettiCelebration /> : null}

      <nav className="exercise-result-nav">
        {onBackToLessons ? (
          <button
            type="button"
            className="exercise-result-sidebar-back"
            onClick={onBackToLessons}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            Quay lại danh sách bài học
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="exercise-result-nav-review"
          onClick={onReview}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
          Xem lại bài làm
        </button>
      </nav>

      {isWrongOnlyRetry ? (
        <p className="exercise-result-mode-note">
          Chế độ luyện lại — chỉ {total} câu đã sai
        </p>
      ) : null}

      <div className="exercise-result-grid">
        <aside className="exercise-result-sidebar">
          <div className="exercise-result-badges">
            <span className="exercise-result-badge exercise-result-badge--primary">
              <MenuBookOutlinedIcon sx={{ fontSize: 14 }} />
              BÀI TẬP
            </span>
            {subjectName ? (
              <span className="exercise-result-badge exercise-result-badge--subject">
                {subjectName}
              </span>
            ) : null}
          </div>
          <h1 className="exercise-result-lesson-title">{lessonTitle}</h1>
          {subtitle ? (
            <p className="exercise-result-lesson-sub">{subtitle}</p>
          ) : null}

          <div className="exercise-result-circle-wrap">
            <div
              className="exercise-result-circle"
              style={{ background: circleBackground }}
            >
              <div className="exercise-result-circle-inner">
                <span className="exercise-result-circle-score">
                  {correctCount}/{total}
                </span>
                <span className="exercise-result-circle-label">câu đúng</span>
              </div>
              {passed ? (
                <span className="exercise-result-circle-star" aria-hidden>
                  <StarOutlinedIcon sx={{ fontSize: 16, color: "#fff" }} />
                </span>
              ) : null}
            </div>
          </div>

          <ul className="exercise-result-stats">
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--ok">
                  <CheckIcon sx={{ fontSize: 14 }} />
                </span>
                Câu đúng
              </span>
              <span className="exercise-result-stat-value">{correctCount}</span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--wrong">
                  <CloseIcon sx={{ fontSize: 14 }} />
                </span>
                Câu sai
              </span>
              <span className="exercise-result-stat-value">{wrongCount}</span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--time">
                  <ScheduleOutlinedIcon sx={{ fontSize: 14 }} />
                </span>
                Thời gian làm bài
              </span>
              <span className="exercise-result-stat-value">
                {formatElapsedTime(elapsedMs)}
              </span>
            </li>
            <li>
              <span className="exercise-result-stat-label">
                <span className="exercise-result-stat-icon exercise-result-stat-icon--score">
                  <StarOutlinedIcon sx={{ fontSize: 14 }} />
                </span>
                Điểm số
              </span>
              <span className="exercise-result-stat-value exercise-result-stat-value--score">
                {scorePct}%
                <span className="exercise-result-stat-hint">
                  {" "}
                  (Đạt {passScorePercent}% là qua)
                </span>
              </span>
            </li>
          </ul>

          {passed ? (
            <div className="exercise-result-toast exercise-result-toast--ok">
              <span aria-hidden>🏆</span>
              <div>
                <p className="exercise-result-toast-title">
                  Tuyệt vời! Bạn đã hoàn thành bài tập.
                </p>
                <p className="exercise-result-toast-sub">
                  Giữ vững phong độ nhé!
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="exercise-result-main">
          <div
            className={`exercise-result-hero exercise-result-hero--${passed ? "pass" : "fail"}`}
          >
            <div
              className={`exercise-result-status-icon${passed ? " is-pass" : " is-fail"}`}
            >
              {passed ? (
                <CheckIcon sx={{ fontSize: 48 }} />
              ) : (
                <CloseIcon sx={{ fontSize: 48 }} />
              )}
            </div>

            <h2 className="exercise-result-hero-title">
              {passed ? "Chúc mừng!" : "Chưa đạt — thử lại nhé!"}
            </h2>

            {passed ? (
              <>
                <p className="exercise-result-hero-sub">
                  Bạn đã hoàn thành bài tập xuất sắc!
                </p>
                <p className="exercise-result-hero-pill">
                  <StarOutlinedIcon sx={{ fontSize: 18 }} />
                  Bạn đã trả lời đúng{" "}
                  {correctCount === total
                    ? "tất cả"
                    : `${correctCount}/${total}`}{" "}
                  câu hỏi.
                </p>
              </>
            ) : null}

            <div className="exercise-result-mascot">
              <img
                src={
                  passed
                    ? EXERCISE_RESULT_MASCOT_PASS
                    : EXERCISE_RESULT_MASCOT_FAIL
                }
                alt={passed ? "Cô giáo chúc mừng" : "Cô giáo động viên"}
                className="exercise-result-mascot-img"
              />
            </div>

            {!passed ? (
              <div className="exercise-result-tip">
                <span aria-hidden>💡</span>
                <p>
                  <strong>Mẹo nhỏ:</strong> Xem lại bài học và luyện thêm những
                  từ vựng còn sai nhé!
                </p>
              </div>
            ) : null}

            <div className="exercise-result-actions">
              <div className="exercise-result-actions-secondary">
                <button
                  type="button"
                  className="exercise-result-btn exercise-result-btn--secondary"
                  onClick={onReview}
                >
                  <span className="exercise-result-btn-icon">
                    <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                  </span>
                  <span className="exercise-result-btn-text exercise-result-btn-text-full">
                    Xem lại bài làm
                  </span>
                  <span className="exercise-result-btn-text exercise-result-btn-text-short">
                    Xem lại
                  </span>
                </button>
                <button
                  type="button"
                  className="exercise-result-btn exercise-result-btn--secondary"
                  onClick={onRetry}
                >
                  <span className="exercise-result-btn-icon">
                    <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
                  </span>
                  <span className="exercise-result-btn-text">Làm lại</span>
                </button>
              </div>
              {onContinueStudy ? (
                <button
                  type="button"
                  className={`exercise-result-btn exercise-result-btn--primary${passed ? " is-pass" : ""}`}
                  onClick={onContinueStudy}
                >
                  <span className="exercise-result-btn-label">
                    <span className="exercise-result-btn-title">
                      {nextLessonTitle ? "Bài tiếp theo" : "Học tiếp bài học"}
                    </span>
                    {nextLessonTitle ? (
                      <span className="exercise-result-btn-sub">
                        {nextLessonTitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="exercise-result-btn-arrow">
                    <ArrowForwardIcon sx={{ fontSize: 22 }} />
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
