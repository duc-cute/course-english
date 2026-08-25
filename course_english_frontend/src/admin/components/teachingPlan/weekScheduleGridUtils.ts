import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { TEACHING_PLAN_TZ } from "./teachingPlanUtils";

/** Mỗi hàng grid = 2 giờ (1 ca dạy thường 2 tiếng). */
export const GRID_STEP_HOURS = 2;
export const DEFAULT_GRID_START_HOUR = 6;
export const DEFAULT_GRID_END_HOUR = 22;
export const GRID_SLOT_HEIGHT_PX = 80;
/** Chiều cao tối thiểu mỗi khối ca — đủ hiển thị vài dòng nội dung. */
export const GRID_EVENT_MIN_HEIGHT_PX = 72;
/** @deprecated use GRID_SLOT_HEIGHT_PX */
export const GRID_HOUR_HEIGHT_PX = GRID_SLOT_HEIGHT_PX;
export const GRID_SLOT_MINUTES = GRID_STEP_HOURS * 60;

function alignHourDown(hour: number): number {
  return Math.floor(hour / GRID_STEP_HOURS) * GRID_STEP_HOURS;
}

function alignHourUp(hour: number): number {
  return Math.ceil(hour / GRID_STEP_HOURS) * GRID_STEP_HOURS;
}

export function gridHeightPx(startHour: number, endHour: number, slotHeightPx = GRID_SLOT_HEIGHT_PX): number {
  const slotCount = (endHour - startHour) / GRID_STEP_HOURS;
  return slotCount * slotHeightPx;
}

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
    startHour: Math.max(0, alignHourDown(minHour - GRID_STEP_HOURS)),
    endHour: Math.min(24, Math.max(alignHourUp(maxHour + GRID_STEP_HOURS), DEFAULT_GRID_END_HOUR)),
  };
}

/** Các mốc giờ hiển thị trên trục dọc (bước 2 giờ). */
export function buildGridHours(startHour: number, endHour: number): number[] {
  const slots: number[] = [];
  for (let h = startHour; h < endHour; h += GRID_STEP_HOURS) {
    slots.push(h);
  }
  return slots;
}

export function formatGridHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatGridDayHeader(iso: string): { weekday: string; dayMonth: string } {
  const date = new Date(`${iso}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    return { weekday: "—", dayMonth: "—" };
  }
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
  slotHeightPx: number = GRID_SLOT_HEIGHT_PX,
): GridEventLayout {
  const gridStartMin = startHour * 60;
  const gridEndMin = endHour * 60;
  const gridTotalMin = gridEndMin - gridStartMin;
  const totalHeightPx = gridHeightPx(startHour, endHour, slotHeightPx);

  const startMin = minutesFromMidnightInTz(session.startAt);
  const endMin = Math.max(startMin + 15, minutesFromMidnightInTz(session.endAt));

  const clampedStart = Math.max(gridStartMin, startMin);
  const clampedEnd = Math.min(gridEndMin, endMin);

  const topPx = ((clampedStart - gridStartMin) / gridTotalMin) * totalHeightPx;
  const heightPx = Math.max(GRID_EVENT_MIN_HEIGHT_PX, ((clampedEnd - clampedStart) / gridTotalMin) * totalHeightPx);

  return { topPx, heightPx };
}

export function snapSlotFromGridClick(
  offsetYPx: number,
  startHour: number,
  endHour: number,
  slotHeightPx: number = GRID_SLOT_HEIGHT_PX,
): { hour: number; minute: number } {
  const totalHeightPx = gridHeightPx(startHour, endHour, slotHeightPx);
  const rawMinutes = startHour * 60 + (offsetYPx / totalHeightPx) * (endHour - startHour) * 60;
  const snapped = Math.round(rawMinutes / GRID_SLOT_MINUTES) * GRID_SLOT_MINUTES;
  const hour = Math.min(23, Math.floor(snapped / 60));
  const minute = snapped % 60;
  return { hour, minute };
}

export function slotTopPx(hour: number, startHour: number, slotHeightPx: number = GRID_SLOT_HEIGHT_PX): number {
  return ((hour - startHour) / GRID_STEP_HOURS) * slotHeightPx;
}

export function endMinutesFromSlot(startHour: number, startMinute: number, durationMin = GRID_SLOT_MINUTES): {
  hour: number;
  minute: number;
} {
  const total = startHour * 60 + startMinute + durationMin;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}
