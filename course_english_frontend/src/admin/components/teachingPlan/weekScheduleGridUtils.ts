import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { TEACHING_PLAN_TZ } from "./teachingPlanUtils";

export const DEFAULT_GRID_START_HOUR = 7;
export const DEFAULT_GRID_END_HOUR = 22;
export const GRID_HOUR_HEIGHT_PX = 56;
export const GRID_SLOT_MINUTES = 30;

export function minutesFromMidnightInTz(iso: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TEACHING_PLAN_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function computeGridHourRange(sessions: ClassSessionRecord[]): {
  startHour: number;
  endHour: number;
} {
  let minHour = DEFAULT_GRID_START_HOUR;
  let maxHour = DEFAULT_GRID_END_HOUR;

  sessions.forEach((session) => {
    const startMin = minutesFromMidnightInTz(session.startAt);
    const endMin = minutesFromMidnightInTz(session.endAt);
    minHour = Math.min(minHour, Math.floor(startMin / 60));
    maxHour = Math.max(maxHour, Math.ceil(endMin / 60));
  });

  return {
    startHour: Math.max(0, minHour - 1),
    endHour: Math.min(24, Math.max(maxHour + 1, DEFAULT_GRID_END_HOUR)),
  };
}

export function buildGridHours(startHour: number, endHour: number): number[] {
  return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
}

export function formatGridHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatGridDayHeader(iso: string): { weekday: string; dayMonth: string } {
  const date = new Date(`${iso}T12:00:00+07:00`);
  const weekday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    timeZone: TEACHING_PLAN_TZ,
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(date);
  return { weekday, dayMonth };
}

export type GridEventLayout = {
  topPx: number;
  heightPx: number;
};

export function layoutSessionOnGrid(
  session: ClassSessionRecord,
  startHour: number,
  endHour: number,
  hourHeightPx: number = GRID_HOUR_HEIGHT_PX,
): GridEventLayout {
  const gridStartMin = startHour * 60;
  const gridEndMin = endHour * 60;
  const gridTotalMin = gridEndMin - gridStartMin;

  const startMin = minutesFromMidnightInTz(session.startAt);
  const endMin = Math.max(startMin + 15, minutesFromMidnightInTz(session.endAt));

  const clampedStart = Math.max(gridStartMin, startMin);
  const clampedEnd = Math.min(gridEndMin, endMin);

  const topPx = ((clampedStart - gridStartMin) / gridTotalMin) * (endHour - startHour) * hourHeightPx;
  const heightPx = Math.max(
    28,
    ((clampedEnd - clampedStart) / gridTotalMin) * (endHour - startHour) * hourHeightPx,
  );

  return { topPx, heightPx };
}

export function snapSlotFromGridClick(
  offsetYPx: number,
  startHour: number,
  hourHeightPx: number = GRID_HOUR_HEIGHT_PX,
): { hour: number; minute: number } {
  const rawMinutes = startHour * 60 + (offsetYPx / hourHeightPx) * 60;
  const snapped = Math.round(rawMinutes / GRID_SLOT_MINUTES) * GRID_SLOT_MINUTES;
  const hour = Math.min(23, Math.floor(snapped / 60));
  const minute = snapped % 60;
  return { hour, minute };
}

export function endMinutesFromSlot(startHour: number, startMinute: number, durationMin = 50): {
  hour: number;
  minute: number;
} {
  const total = startHour * 60 + startMinute + durationMin;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}
