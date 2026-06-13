import "./ui.css";

type VqProgressBarProps = {
  value: number;
  label?: string;
  hint?: string;
  showThumb?: boolean;
};

export function VqProgressBar({ value, label, hint, showThumb = false }: VqProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="vq-progress">
      {label || hint ? (
        <div className="vq-progress__label">
          <span>{label}</span>
          {hint ? <span>{hint}</span> : null}
        </div>
      ) : null}
      <div className="vq-progress__track">
        <div className="vq-progress__fill" style={{ width: `${pct}%` }}>
          {showThumb ? <span className="vq-progress__thumb" aria-hidden>★</span> : null}
        </div>
      </div>
    </div>
  );
}
