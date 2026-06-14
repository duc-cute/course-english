import type { NotificationRecord } from "../../shared/api/notification";

export type NotificationDayGroup = {
  label: string;
  items: NotificationRecord[];
};

function startOfDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function startOfWeekMonday(date: Date): number {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function groupNotificationsByDay(items: NotificationRecord[]): NotificationDayGroup[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = startOfWeekMonday(now);

  const today: NotificationRecord[] = [];
  const yesterday: NotificationRecord[] = [];
  const thisWeek: NotificationRecord[] = [];
  const earlier: NotificationRecord[] = [];

  for (const item of items) {
    if (!item.createdAt) {
      earlier.push(item);
      continue;
    }
    const dayStart = startOfDay(new Date(item.createdAt));
    if (dayStart === todayStart) {
      today.push(item);
    } else if (dayStart === yesterdayStart) {
      yesterday.push(item);
    } else if (dayStart >= weekStart) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  }

  const groups: NotificationDayGroup[] = [];
  if (today.length > 0) groups.push({ label: "Hôm nay", items: today });
  if (yesterday.length > 0) groups.push({ label: "Hôm qua", items: yesterday });
  if (thisWeek.length > 0) groups.push({ label: "Tuần này", items: thisWeek });
  if (earlier.length > 0) groups.push({ label: "Trước đó", items: earlier });
  return groups;
}
