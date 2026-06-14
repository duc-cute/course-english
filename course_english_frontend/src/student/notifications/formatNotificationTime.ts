const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", { weekday: "long" });
const timeFormatter = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatNotificationTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart.getTime() === todayStart.getTime()) {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    return `${hours} giờ trước`;
  }

  const timeLabel = timeFormatter.format(date);

  if (dayStart.getTime() === yesterdayStart.getTime()) {
    return `Hôm qua, ${timeLabel}`;
  }

  const weekday = capitalizeFirst(weekdayFormatter.format(date));
  return `${weekday}, ${timeLabel}`;
}
