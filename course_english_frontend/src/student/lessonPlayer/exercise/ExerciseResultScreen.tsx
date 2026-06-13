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
import { MascotAvatar } from "../../ui/MascotAvatar";
import { VqBadge } from "../../ui/VqBadge";
import { VqButton } from "../../ui/VqButton";
import { VqProgressBar } from "../../ui/VqProgressBar";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { buildPracticeSubtitle, formatElapsedTime } from "./exerciseResultUtils";

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
  onRetryWrong?: () => void;
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
  onRetryWrong,
  onContinueStudy,
  onBackToLessons,
}: ExerciseResultScreenProps) {
  const wrongCount = wrongCountProp ?? total - correctCount;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const requiredCorrect = total > 0 ? Math.ceil((total * passScorePercent) / 100) : 0;
  const questionsStillNeeded = Math.max(0, requiredCorrect - correctCount);
  const subtitle = buildPracticeSubtitle(total);

  return (
    <div
      className={`vq-exercise-result exercise-result${passed ? " exercise-result--pass vq-exercise-result--pass" : " exercise-result--fail vq-exercise-result--fail"}`}
    >
      {passed ? <ConfettiCelebration /> : null}

      {onBackToLessons ? (
        <button type="button" className="vq-exercise-result__back" onClick={onBackToLessons}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Quay lại danh sách bài học
        </button>
      ) : null}

      {isWrongOnlyRetry ? (
        <p className="vq-exercise-result__mode-note">Chế độ luyện lại — chỉ {total} câu đã sai</p>
      ) : null}

      <div className="vq-exercise-result__hero">
        <div className={`vq-exercise-result__status${passed ? " is-pass" : " is-fail"}`}>
          {passed ? <CheckIcon sx={{ fontSize: 40 }} /> : <CloseIcon sx={{ fontSize: 40 }} />}
        </div>

        <MascotAvatar className="vq-exercise-result__mascot" />

        <div className="vq-exercise-result__headline">
          <div className="vq-exercise-result__badges">
            <VqBadge tone="muted" icon={<MenuBookOutlinedIcon sx={{ fontSize: 14 }} />}>
              Bài tập
            </VqBadge>
            {subjectName ? <VqBadge tone="muted">{subjectName}</VqBadge> : null}
          </div>
          <h2 className="vq-exercise-result__title">{passed ? "Chúc mừng!" : "Chưa đạt — thử lại nhé!"}</h2>
          <p className="vq-exercise-result__lesson">{lessonTitle}</p>
          {subtitle ? <p className="vq-exercise-result__sub">{subtitle}</p> : null}
          {passed ? (
            <p className="vq-exercise-result__pill">
              <StarOutlinedIcon sx={{ fontSize: 18 }} />
              Bạn đã trả lời đúng {correctCount === total ? "tất cả" : `${correctCount}/${total}`} câu hỏi.
            </p>
          ) : (
            <p className="vq-exercise-result__hint">
              Cần đúng ít nhất <strong>{requiredCorrect} câu</strong> — bạn cần thêm{" "}
              <strong>{questionsStillNeeded} câu nữa</strong>.
            </p>
          )}
        </div>
      </div>

      <div className="vq-exercise-result__score-card">
        <div className="vq-exercise-result__score-ring" aria-hidden>
          <span className="vq-exercise-result__score-value">
            {correctCount}/{total}
          </span>
          <span className="vq-exercise-result__score-label">câu đúng</span>
        </div>
        <VqProgressBar value={scorePct} label={`${scorePct}%`} hint={`Đạt ${passScorePercent}% là qua`} />
      </div>

      <ul className="vq-exercise-result__stats">
        <li>
          <CheckIcon sx={{ fontSize: 18 }} />
          <span>Câu đúng</span>
          <strong>{correctCount}</strong>
        </li>
        <li>
          <CloseIcon sx={{ fontSize: 18 }} />
          <span>Câu sai</span>
          <strong>{wrongCount}</strong>
        </li>
        <li>
          <ScheduleOutlinedIcon sx={{ fontSize: 18 }} />
          <span>Thời gian</span>
          <strong>{formatElapsedTime(elapsedMs)}</strong>
        </li>
        <li>
          <StarOutlinedIcon sx={{ fontSize: 18 }} />
          <span>Điểm</span>
          <strong>{scorePct}%</strong>
        </li>
      </ul>

      {passed ? (
        <div className="vq-exercise-result__toast">
          <EmojiEventsOutlinedIcon sx={{ fontSize: 22 }} />
          <div>
            <p className="vq-exercise-result__toast-title">Tuyệt vời! Bạn đã hoàn thành bài tập.</p>
            <p className="vq-exercise-result__toast-sub">Giữ vững phong độ nhé!</p>
          </div>
        </div>
      ) : (
        <div className="vq-exercise-result__tip">
          <span aria-hidden>💡</span>
          <p>
            <strong>Mẹo:</strong> Luyện lại những câu sai hoặc xem lại bài học trước khi làm lại toàn bộ.
          </p>
        </div>
      )}

      <div className="vq-exercise-result__actions">
        <div className="vq-exercise-result__actions-row">
          <VqButton variant="ghost" onClick={onReview}>
            <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
            Xem lại
          </VqButton>
          {onRetryWrong ? (
            <VqButton variant="ghost" onClick={onRetryWrong}>
              <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
              Luyện câu sai ({wrongCount})
            </VqButton>
          ) : null}
          <VqButton variant="ghost" onClick={onRetry}>
            <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
            Làm lại
          </VqButton>
        </div>
        {onContinueStudy ? (
          <VqButton fullWidth onClick={onContinueStudy}>
            <span className="vq-exercise-result__cta-label">
              <span>{nextLessonTitle ? "Bài tiếp theo" : "Học tiếp bài học"}</span>
              {nextLessonTitle ? <small>{nextLessonTitle}</small> : null}
            </span>
            <ArrowForwardIcon sx={{ fontSize: 22 }} />
          </VqButton>
        ) : null}
      </div>
    </div>
  );
}
