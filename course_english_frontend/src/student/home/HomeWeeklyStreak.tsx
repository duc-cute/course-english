import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import type { WeeklyStudyDay } from "./getWeeklyStudyDays";

type HomeWeeklyStreakProps = {
  days: WeeklyStudyDay[];
};

export function HomeWeeklyStreak({ days }: HomeWeeklyStreakProps) {
  return (
    <article className="vq-home-panel vq-home-panel--weekly">
      <h3 className="vq-home-panel__title">Streak tuần này</h3>
      <div className="vq-home-week">
        {days.map((day) => {
          const className = [
            "vq-home-week__day",
            day.active ? "vq-home-week__day--active" : "",
            day.isToday ? "vq-home-week__day--today" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={day.label} className="vq-home-week__col">
              <span className="vq-home-week__label">{day.label}</span>
              <div className={className}>
                {day.active ? (
                  <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 22 }} />
                ) : (
                  <EventOutlinedIcon sx={{ fontSize: 20, opacity: 0.5 }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
