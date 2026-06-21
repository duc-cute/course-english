/** Cumulative XP thresholds — level N starts at LEVEL_THRESHOLDS[N - 1]. */
const LEVEL_THRESHOLDS = [0, 40, 120, 240, 400, 600, 850, 1150];

export type LevelInfo = {
  level: number;
  xp: number;
  nextLevelXp: number;
  xpToNext: number;
  progressPct: number;
};

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp);
  let level = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const nextLevelXp =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + level * 80;
  const xpToNext = Math.max(0, nextLevelXp - safeXp);
  const progressPct = nextLevelXp > 0 ? Math.min(100, (safeXp / nextLevelXp) * 100) : 0;

  return {
    level,
    xp: safeXp,
    nextLevelXp,
    xpToNext,
    progressPct,
  };
}
