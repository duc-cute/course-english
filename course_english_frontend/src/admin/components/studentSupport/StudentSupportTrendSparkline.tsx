type Props = {
  trendPercent?: number | null;
  className?: string;
};

/** Mini sparkline gợi ý xu hướng điểm (trang trí, dựa trên scoreTrendPercent). */
export function StudentSupportTrendSparkline({ trendPercent, className = "" }: Props) {
  const tone =
    trendPercent == null || trendPercent === 0
      ? "flat"
      : trendPercent < 0
        ? "down"
        : "up";

  const paths: Record<string, string> = {
    down: "M0 5 L20 10 L40 5 L60 20 L80 15 L100 28",
    up: "M0 28 L20 22 L40 25 L60 10 L80 14 L100 4",
    flat: "M0 15 L20 14 L40 16 L60 15 L80 14 L100 15",
  };

  return (
    <svg
      className={`student-support-sparkline student-support-sparkline--${tone} ${className}`.trim()}
      viewBox="0 0 100 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[tone]} />
    </svg>
  );
}
