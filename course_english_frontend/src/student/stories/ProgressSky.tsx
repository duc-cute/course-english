import { useEffect, useState, useMemo } from "react";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import ParagraphIcon from "@mui/icons-material/Notes";
import TimerIcon from "@mui/icons-material/Timer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { prefersReducedMotion, useSmoothProgress } from "./useSmoothProgress";

type ProgressSkyProps = {
  progress: number; // 0 to 1
  theme: string;
  chapterTitle?: string;
  currentParagraph: number;
  totalParagraphs: number;
  readingTimeMinutes: number;
  autoScrollOn?: boolean;
  onToggleAutoScroll?: () => void;
};

const THEME_ICONS: Record<
  string,
  { start: string; end: string; startLabel: string; endLabel: string; emoji: string }
> = {
  ocean: { start: "🐚", end: "👑", startLabel: "Bắt đầu", endLabel: "Báu vật", emoji: "🌊" },
  forest: { start: "🌳", end: "🏡", startLabel: "Cái cây", endLabel: "Ngôi nhà", emoji: "🌿" },
  night: { start: "🌙", end: "🌟", startLabel: "Đêm đen", endLabel: "Sao sáng", emoji: "⭐" },
  snow: { start: "❄️", end: "⛄", startLabel: "Khởi hành", endLabel: "Người tuyết", emoji: "❄️" },
  autumn: { start: "🍁", end: "🏡", startLabel: "Rừng thu", endLabel: "Nhà ấm", emoji: "🍂" },
  fantasy: { start: "📖", end: "🏰", startLabel: "Sách cổ", endLabel: "Lâu đài", emoji: "✨" },
  space: { start: "🪐", end: "🌌", startLabel: "Hành tinh", endLabel: "Thiên hà", emoji: "☄️" },
};

export function ProgressSky({
  progress,
  theme,
  chapterTitle = "Chương 1: Khởi đầu",
  currentParagraph,
  totalParagraphs,
  readingTimeMinutes,
  autoScrollOn = true,
  onToggleAutoScroll,
}: ProgressSkyProps) {
  const normTheme = theme.toLowerCase();
  const themeSpec = THEME_ICONS[normTheme] ?? THEME_ICONS.ocean;

  const [milestoneCelebrations, setMilestoneCelebrations] = useState<
    { id: number; text: string; x: number; y: number }[]
  >([]);
  const [lastMilestone, setLastMilestone] = useState<number>(0);
  const [motionReduced] = useState(() => prefersReducedMotion());
  const smoothProgress = useSmoothProgress(progress, !motionReduced);

  // Compute bezier position (t from 0 to 1)
  const getBezierPoint = (t: number) => {
    const x0 = 30, y0 = 60;
    const xc = 250, yc = 15;
    const x1 = 470, y1 = 60;

    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xc + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * yc + t * t * y1;
    return { x, y };
  };

  const indicatorPos = useMemo(() => getBezierPoint(smoothProgress), [smoothProgress]);

  const p25 = useMemo(() => getBezierPoint(0.25), []);
  const p50 = useMemo(() => getBezierPoint(0.5), []);
  const p75 = useMemo(() => getBezierPoint(0.75), []);

  const timeLeft = Math.max(0, Math.round((1 - smoothProgress) * (readingTimeMinutes || 5)));

  // Trigger celebrations when crossing milestones
  useEffect(() => {
    let triggeredMilestone = 0;
    if (progress >= 1.0) triggeredMilestone = 100;
    else if (progress >= 0.75) triggeredMilestone = 75;
    else if (progress >= 0.5) triggeredMilestone = 50;
    else if (progress >= 0.25) triggeredMilestone = 25;

    if (triggeredMilestone > lastMilestone) {
      setLastMilestone(triggeredMilestone);
      const pos = getBezierPoint(triggeredMilestone / 100);
      const id = Date.now();
      const newCelebration = {
        id,
        text: themeSpec.emoji,
        x: pos.x,
        y: pos.y,
      };
      setMilestoneCelebrations((prev) => [...prev, newCelebration]);

      // Remove after animation finishes
      setTimeout(() => {
        setMilestoneCelebrations((prev) => prev.filter((c) => c.id !== id));
      }, 1800);
    }
  }, [progress, lastMilestone, themeSpec.emoji]);

  return (
    <div className="progress-sky-card">
      {onToggleAutoScroll ? (
        <Tooltip
          title={
            autoScrollOn
              ? "Tắt tự cuộn — giữ ảnh / cuộn tay tự do"
              : "Bật tự cuộn theo câu đang đọc"
          }
          placement="left"
        >
          <IconButton
            size="small"
            className={`progress-sky-autoscroll-btn ${autoScrollOn ? "progress-sky-autoscroll-btn--on" : "progress-sky-autoscroll-btn--off"}`}
            onClick={onToggleAutoScroll}
            aria-label={autoScrollOn ? "Tắt tự cuộn" : "Bật tự cuộn"}
            aria-pressed={autoScrollOn}
          >
            {autoScrollOn ? (
              <MouseOutlinedIcon fontSize="small" />
            ) : (
              <span className="progress-sky-autoscroll-btn__off-wrap" aria-hidden>
                <MouseOutlinedIcon fontSize="small" />
              </span>
            )}
          </IconButton>
        </Tooltip>
      ) : null}

      <div className="progress-sky-chapter-bar" title={chapterTitle}>
        <AutoStoriesOutlinedIcon className="progress-sky-chapter-bar__icon" />
        <span className="progress-sky-chapter-bar__text">{chapterTitle}</span>
      </div>

      <div className="progress-sky-title-row">
        <div className="progress-sky-endpoint progress-sky-endpoint--start">
          <span className="progress-sky-endpoint__icon">{themeSpec.start}</span>
          <span className="progress-sky-endpoint__label">Bắt đầu</span>
        </div>
        <span className="progress-sky-percent">{Math.round(smoothProgress * 100)}% Hoàn thành</span>
        <div className="progress-sky-endpoint progress-sky-endpoint--end">
          <span className="progress-sky-endpoint__label">Đích đến</span>
          <span
            className={`progress-sky-endpoint__icon progress-sky-endpoint__icon--dest${progress >= 1.0 ? " progress-sky-endpoint__icon--dest-glow" : ""}`}
          >
            {themeSpec.end}
          </span>
        </div>
      </div>

      <div className="progress-sky-svg-wrap">
        <svg viewBox="0 0 500 80" width="100%" height="100%">
          <defs>
            <filter id="progress-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Path */}
          <path d="M 30 60 Q 250 15 470 60" className="progress-sky-path-bg" />

          {/* Active Fill Path */}
          <path
            d="M 30 60 Q 250 15 470 60"
            className="progress-sky-path-fill"
            style={{
              strokeDasharray: 460,
              strokeDashoffset: 460 - smoothProgress * 460,
            }}
          />

          {/* Milestone Nodes */}
          {/* 25% Node */}
          <circle
            cx={p25.x}
            cy={p25.y}
            r="5"
            className={`progress-sky-node ${progress >= 0.25 ? "progress-sky-node--unlocked" : ""}`}
          />
          <text x={p25.x} y={p25.y - 12} fontSize="9" fill="var(--theme-text-muted)" textAnchor="middle" fontWeight={700}>
            25%
          </text>

          {/* 50% Node */}
          <circle
            cx={p50.x}
            cy={p50.y}
            r="5"
            className={`progress-sky-node ${progress >= 0.5 ? "progress-sky-node--unlocked" : ""}`}
          />
          <text x={p50.x} y={p50.y - 12} fontSize="9" fill="var(--theme-text-muted)" textAnchor="middle" fontWeight={700}>
            50%
          </text>

          {/* 75% Node */}
          <circle
            cx={p75.x}
            cy={p75.y}
            r="5"
            className={`progress-sky-node ${progress >= 0.75 ? "progress-sky-node--unlocked" : ""}`}
          />
          <text x={p75.x} y={p75.y - 12} fontSize="9" fill="var(--theme-text-muted)" textAnchor="middle" fontWeight={700}>
            75%
          </text>

          {/* Moving indicator — transform animates smoothly via RAF-interpolated progress */}
          <g
            className="progress-sky-indicator"
            transform={`translate(${indicatorPos.x}, ${indicatorPos.y + 6})`}
          >
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="progress-sky-indicator__star"
            >
              ⭐
            </text>
          </g>
        </svg>

        {/* Milestone Celebration Floating Elements */}
        {milestoneCelebrations.map((c) => (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: `${(c.x / 500) * 100}%`,
              top: `${(c.y / 80) * 100}%`,
              transform: "translate(-50%, -50%)",
              fontSize: "1.5rem",
              animation: "floatRise 1.8s forwards ease-out",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {c.text}
          </div>
        ))}
      </div>

      {/* Info metadata bar — desktop/tablet only */}
      <div className="progress-sky-meta-row">
        <div className="progress-sky-meta-item progress-sky-meta-item--title">
          <AutoStoriesOutlinedIcon className="progress-sky-meta-icon" />
          <span className="progress-sky-meta-text" title={chapterTitle}>{chapterTitle}</span>
        </div>
        <div className="progress-sky-meta-item progress-sky-meta-item--center progress-sky-meta-item--detail">
          <ParagraphIcon className="progress-sky-meta-icon" />
          <span className="progress-sky-meta-text">Đoạn {currentParagraph} / {totalParagraphs}</span>
        </div>
        <div className="progress-sky-meta-item progress-sky-meta-item--end progress-sky-meta-item--detail">
          <TimerIcon className="progress-sky-meta-icon" />
          <span className="progress-sky-meta-text">Thời gian còn lại: {timeLeft} phút</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatRise {
          0% { transform: translate(-50%, -50%) scale(0.5) translateY(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5) translateY(-50px); opacity: 0; }
        }
      `}} />
    </div>
  );
}
