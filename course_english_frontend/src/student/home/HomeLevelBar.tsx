import { getLevelInfo } from "./levelUtils";

type HomeLevelBarProps = {
  xp: number;
  className?: string;
};

export function HomeLevelBar({ xp, className = "" }: HomeLevelBarProps) {
  const { level, xp: currentXp, nextLevelXp, xpToNext } = getLevelInfo(xp);
  const progressPct = Math.min(100, (currentXp / nextLevelXp) * 100);

  return (
    <section className={`vq-home-level ${className}`} aria-label="Tiến độ cấp độ">
      {/* Mascot robot on the left */}
      <div className="vq-home-level__mascot" aria-hidden>
        <svg viewBox="0 0 160 160" className="vq-home-level__mascot-svg">
          <ellipse cx="80" cy="148" rx="46" ry="8" fill="rgba(45,75,215,0.12)" />
          {/* Head */}
          <rect x="36" y="44" width="88" height="88" rx="28" fill="#dee0ff" stroke="#2d4bd7" strokeWidth="4" />
          {/* Eyes (left winking, right open) */}
          <path d="M48 78 Q58 68 68 78" fill="none" stroke="#1a1b23" strokeWidth="4" strokeLinecap="round" /> {/* Wink */}
          <circle cx="102" cy="78" r="10" fill="#1a1b23" />
          <circle cx="105" cy="75" r="3" fill="#fff" />
          {/* Smile */}
          <path d="M58 102 Q80 118 102 102" fill="none" stroke="#2d4bd7" strokeWidth="4" strokeLinecap="round" />
          {/* Headphones */}
          <path d="M28 88 A 52 52 0 0 1 132 88" fill="none" stroke="#9547f7" strokeWidth="6" strokeLinecap="round" />
          <rect x="24" y="76" width="12" height="24" rx="6" fill="#9547f7" />
          <rect x="124" y="76" width="12" height="24" rx="6" fill="#9547f7" />
          {/* Antenna */}
          <rect x="76" y="28" width="8" height="16" rx="4" fill="#2d4bd7" />
          <circle cx="80" cy="24" r="6" fill="#87fe45" />
        </svg>
      </div>

      <div className="vq-home-level__content">
        <div className="vq-home-level__info">
          <span className="vq-home-level__badge">Level {level}</span>
          <span className="vq-home-level__hint">
            Bạn chỉ còn <strong className="vq-home-level__highlight">{xpToNext} XP</strong> để lên Level {level + 1}!
          </span>
        </div>

        <div className="vq-home-level__progress-column">
          <div className="vq-home-level__track" aria-hidden>
            <div className="vq-home-level__fill" style={{ width: `${progressPct}%` }}>
              <div className="vq-home-level__fill-pulse" />
            </div>
          </div>
          <span className="vq-home-level__xp">
            {currentXp} <span className="vq-home-level__xp-max">/ {nextLevelXp} XP</span>
          </span>
        </div>
      </div>

      {/* Gift Box on the right */}
      <div className="vq-home-level__gift" aria-hidden>
        🎁
      </div>
    </section>
  );
}
