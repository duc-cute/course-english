import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import type { WeeklyStudyDay } from "./getWeeklyStudyDays";

type HomeWeeklyStreakProps = {
  days: WeeklyStudyDay[];
  weeklyStreakCount: number;
};

function buildStreakFooter(activeCount: number): string {
  const badgeTarget = 3;
  if (activeCount >= badgeTarget) {
    return "Tuyệt vời! Bạn đã học đủ để nhận huy hiệu On fire tuần này!";
  }
  const remaining = badgeTarget - activeCount;
  return `Giữ streak thêm ${remaining} ngày để nhận huy hiệu!`;
}

export function HomeWeeklyStreak({ days, weeklyStreakCount }: HomeWeeklyStreakProps) {
  return (
    <article className="vq-home-panel vq-home-panel--weekly">
      <h3 className="vq-home-panel__title">
        <span className="vq-home-panel__title-icon" aria-hidden>🔥</span>
        Streak tuần này
      </h3>
      <div className="vq-home-week">
        {days.map((day, index) => {
          const todayIndex = days.findIndex((d) => d.isToday);
          const isTomorrow = todayIndex !== -1 && index === todayIndex + 1;
          const className = [
            "vq-home-week__day",
            day.active ? "vq-home-week__day--active" : "",
            day.isToday ? "vq-home-week__day--today" : "",
            isTomorrow ? "vq-home-week__day--tomorrow" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={day.label} className="vq-home-week__col">
              <span className="vq-home-week__label">{day.label}</span>
              <div className={className}>
                {day.active ? (
                  "🔥"
                ) : day.isToday ? (
                  <span className="vq-home-week__today-num">
                    {day.label.startsWith("T") ? day.label.slice(1) : day.label}
                  </span>
                ) : isTomorrow ? (
                  "•"
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="vq-home-week__footer">
        <EmojiEventsOutlinedIcon sx={{ fontSize: 18, verticalAlign: "text-bottom", marginRight: "6px" }} />
        {buildStreakFooter(weeklyStreakCount)}
      </p>
    </article>
  );
}
