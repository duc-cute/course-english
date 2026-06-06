type QuestionProgressBarProps = {
  current: number;
  total: number;
};

export function QuestionProgressBar({ current, total }: QuestionProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="exercise-progress">
      <div className="exercise-progress-head">
        <span className="exercise-progress-label">Tiến độ</span>
        <span className="exercise-progress-count">
          {current} / {total}
        </span>
      </div>
      <div className="exercise-progress-track" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
        <div className="exercise-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
