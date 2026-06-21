import type { BadgeId } from "./badges";

type BadgeGraphicProps = {
  id: BadgeId;
  unlocked: boolean;
  size?: number;
};

export function BadgeGraphic({ id, unlocked, size = 80 }: BadgeGraphicProps) {
  // Gradients and visual assets defined in SVG
  const isStudy = id.startsWith("study_");
  const isStreak = id.startsWith("streak_");
  const isXp = id.startsWith("xp_");
  const isSpecial = id.startsWith("special_");

  // Determine colors based on unlocking status and ID
  let gradStart = "#cbd5e1";
  let gradEnd = "#94a3b8";

  if (unlocked) {
    if (isStudy) {
      if (id === "study_starter") { gradStart = "#60a5fa"; gradEnd = "#2563eb"; }
      else if (id === "study_bookworm") { gradStart = "#34d399"; gradEnd = "#059669"; }
      else if (id === "study_scholar") { gradStart = "#a78bfa"; gradEnd = "#7c3aed"; }
      else { gradStart = "#fbbf24"; gradEnd = "#d97706"; } // master, legend
    } else if (isStreak) {
      if (id === "streak_1" || id === "streak_3" || id === "streak_7") {
        gradStart = "#f97316"; gradEnd = "#ea580c";
      } else if (id === "streak_14") {
        gradStart = "#f43f5e"; gradEnd = "#e11d48";
      } else if (id === "streak_30") {
        gradStart = "#ec4899"; gradEnd = "#db2777";
      } else {
        gradStart = "#a855f7"; gradEnd = "#7c3aed"; // 50 days
      }
    } else if (isXp) {
      if (id === "xp_10") { gradStart = "#4ade80"; gradEnd = "#16a34a"; }
      else if (id === "xp_50") { gradStart = "#2dd4bf"; gradEnd = "#0d9488"; }
      else if (id === "xp_100") { gradStart = "#60a5fa"; gradEnd = "#2563eb"; }
      else if (id === "xp_250") { gradStart = "#c084fc"; gradEnd = "#9333ea"; }
      else if (id === "xp_500") { gradStart = "#facc15"; gradEnd = "#ca8a04"; }
      else { gradStart = "#ec4899"; gradEnd = "#7c3aed"; } // 1000 XP gradient
    } else if (isSpecial) {
      if (id === "special_listener") { gradStart = "#60a5fa"; gradEnd = "#2563eb"; }
      else if (id === "special_vocab_king") { gradStart = "#4ade80"; gradEnd = "#16a34a"; }
      else if (id === "special_perfectionist") { gradStart = "#c084fc"; gradEnd = "#9333ea"; }
      else if (id === "special_speed_learner") { gradStart = "#fb923c"; gradEnd = "#ea580c"; }
      else if (id === "special_daily_learner") { gradStart = "#2dd4bf"; gradEnd = "#0d9488"; }
      else { gradStart = "#475569"; gradEnd = "#1e293b"; } // top student: dark metallic gray
    }
  }

  // Draw background shape
  const renderShape = () => {
    if (isStudy) {
      // Hexagon shape
      return (
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill={`url(#grad_${id})`}
          stroke={unlocked ? "#ffffff" : "#e2e8f0"}
          strokeWidth="3.5"
          filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))"
        />
      );
    } else if (isStreak) {
      // Shield shape
      return (
        <path
          d="M 16 12 C 34 10, 66 10, 84 12 C 84 40, 80 68, 50 92 C 20 68, 16 40, 16 12 Z"
          fill={`url(#grad_${id})`}
          stroke={unlocked ? "#ffffff" : "#e2e8f0"}
          strokeWidth="3.5"
          filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))"
        />
      );
    } else if (isXp) {
      // 10-sided polygon badge
      return (
        <path
          d="M 50 5 L 63 9 L 75 17 L 83 29 L 85 43 L 81 57 L 72 69 L 59 77 L 45 78 L 31 73 L 20 63 L 15 49 L 16 35 L 23 22 L 35 12 Z"
          fill={`url(#grad_${id})`}
          stroke={unlocked ? "#ffffff" : "#e2e8f0"}
          strokeWidth="3.5"
          filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))"
        />
      );
    } else {
      // Special: Circle shape
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={`url(#grad_${id})`}
            stroke={unlocked ? "#ffffff" : "#e2e8f0"}
            strokeWidth="3.5"
            filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.08))"
          />
          {unlocked && (
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
            />
          )}
        </>
      );
    }
  };

  // Draw icon/text inside
  const renderIcon = () => {
    const iconColor = unlocked ? "#ffffff" : "#94a3b8";

    if (isStudy) {
      // Open book path
      return (
        <path
          d="M26 36c4 0 9 2.5 12 4.5V72c-3-2-8-4.5-12-4.5-6 0-11 2-14 3.5V40c3-1.5 8-4 14-4zm48 0c-4 0-9 2.5-12 4.5V72c3-2 8-4.5 12-4.5 6 0 11 2 14 3.5V40c-3-1.5-8-4-14-4z"
          fill="none"
          stroke={iconColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, -2)"
        />
      );
    } else if (isStreak) {
      // Fire flame path with streak number inside
      const streakNum = id.replace("streak_", "");
      return (
        <g transform="translate(0, 2)">
          <path
            d="M 50 15 C 65 35, 75 42, 75 58 C 75 72, 63.8 82, 50 82 C 36.2 82, 25 72, 25 58 C 25 42, 35 35, 50 15 Z"
            fill={iconColor}
            opacity={unlocked ? 0.95 : 0.6}
          />
          {unlocked && (
            <text
              x="50"
              y="63"
              fill="#c2410c" // dark orange text inside flame
              fontSize="20"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {streakNum}
            </text>
          )}
        </g>
      );
    } else if (isXp) {
      // XP Text in center
      const xpVal = id.replace("xp_", "") + " XP";
      return (
        <text
          x="50"
          y="49"
          fill={iconColor}
          fontSize="15"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="sans-serif"
          letterSpacing="-0.5"
        >
          {xpVal}
        </text>
      );
    } else {
      // Special Badge Icons
      switch (id) {
        case "special_listener":
          // Headphones
          return (
            <path
              d="M30 54 A 20 20 0 0 1 70 54 V 66 A 6 6 0 0 1 64 72 H 61 A 3 3 0 0 1 58 69 V 57 A 3 3 0 0 1 61 54 H 66 V 54 A 16 16 0 0 0 34 54 V 54 H 39 A 3 3 0 0 1 42 57 V 69 A 3 3 0 0 1 39 72 H 36 A 6 6 0 0 1 30 66 Z"
              fill={iconColor}
            />
          );
        case "special_vocab_king":
          // "ABC" Text
          return (
            <text
              x="50"
              y="58"
              fill={iconColor}
              fontSize="22"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="sans-serif"
              letterSpacing="1"
            >
              ABC
            </text>
          );
        case "special_perfectionist":
          // Target / Bullseye
          return (
            <g fill="none" stroke={iconColor} strokeWidth="4" transform="translate(0, 0)">
              <circle cx="50" cy="50" r="24" />
              <circle cx="50" cy="50" r="14" />
              <circle cx="50" cy="50" r="5" fill={iconColor} />
            </g>
          );
        case "special_speed_learner":
          // Lightning bolt
          return (
            <path
              d="M56 20 L30 52 H48 L44 80 L70 48 H52 Z"
              fill={iconColor}
            />
          );
        case "special_daily_learner":
          // Calendar
          return (
            <g fill="none" stroke={iconColor} strokeWidth="4" transform="translate(0, 0)">
              <rect x="28" y="28" width="44" height="44" rx="6" />
              <line x1="28" y1="42" x2="72" y2="42" />
              <circle cx="39" cy="54" r="2.5" fill={iconColor} stroke="none" />
              <circle cx="50" cy="54" r="2.5" fill={iconColor} stroke="none" />
              <circle cx="61" cy="54" r="2.5" fill={iconColor} stroke="none" />
              <circle cx="39" cy="63" r="2.5" fill={iconColor} stroke="none" />
              <circle cx="50" cy="63" r="2.5" fill={iconColor} stroke="none" />
              <circle cx="61" cy="63" r="2.5" fill={iconColor} stroke="none" />
              <line x1="38" y1="22" x2="38" y2="30" strokeLinecap="round" />
              <line x1="62" y1="22" x2="62" y2="30" strokeLinecap="round" />
            </g>
          );
        case "special_top_student":
          // Crown
          return (
            <g transform="translate(0, 2)">
              <path
                d="M24 72 L18 36 L38 52 L50 26 L62 52 L82 36 L76 72 Z"
                fill={unlocked ? "#fbbf24" : iconColor} // Gold crown if unlocked
              />
              <circle cx="18" cy="34" r="2.5" fill={unlocked ? "#fbbf24" : iconColor} />
              <circle cx="50" cy="24" r="2.5" fill={unlocked ? "#fbbf24" : iconColor} />
              <circle cx="82" cy="34" r="2.5" fill={unlocked ? "#fbbf24" : iconColor} />
            </g>
          );
        default:
          return null;
      }
    }
  };

  // Laurel branches for Legend badge
  const renderLaurels = () => {
    if (id !== "study_legend") return null;

    const laurelColor = unlocked ? "#fbbf24" : "#94a3b8";

    return (
      <g stroke={laurelColor} strokeWidth="3" fill="none" strokeLinecap="round">
        {/* Left Branch */}
        <path d="M 20 72 C 3 56, 3 36, 20 20" />
        <path d="M12 28 C8 26, 6 22, 10 19 C12 21, 14 25, 12 28" fill={laurelColor} />
        <path d="M7 40 C3 38, 1 34, 5 31 C7 33, 9 37, 7 40" fill={laurelColor} />
        <path d="M6 53 C2 51, 0 47, 4 44 C6 46, 8 50, 6 53" fill={laurelColor} />
        <path d="M10 65 C6 63, 4 59, 8 56 C10 58, 12 62, 10 65" fill={laurelColor} />

        {/* Right Branch */}
        <path d="M 80 72 C 97 56, 97 36, 80 20" />
        <path d="M88 28 C92 26, 94 22, 90 19 C88 21, 86 25, 88 28" fill={laurelColor} />
        <path d="M93 40 C97 38, 99 34, 95 31 C93 33, 91 37, 93 40" fill={laurelColor} />
        <path d="M94 53 C98 51, 100 47, 96 44 C94 46, 92 50, 94 53" fill={laurelColor} />
        <path d="M90 65 C94 63, 96 59, 92 56 C90 58, 88 62, 90 65" fill={laurelColor} />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="student-vq-badge-graphic"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`grad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradStart} />
          <stop offset="100%" stopColor={gradEnd} />
        </linearGradient>
      </defs>
      {renderLaurels()}
      {renderShape()}
      {renderIcon()}
    </svg>
  );
}
