import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { TEACHING_PLAN_TZ, formatTodayIsoInTz } from "./teachingPlanUtils";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function toIsoDateInTz(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TEACHING_PLAN_TZ }).format(date);
}

export function getDayOfWeekInTz(iso: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TEACHING_PLAN_TZ,
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00+07:00`));
  return WEEKDAY_MAP[weekday] ?? 0;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00+07:00`);
  date.setDate(date.getDate() + days);
  return toIsoDateInTz(date);
}

/** Monday of the week containing `iso` (VN, week starts Mon). */
export function getWeekStart(iso?: string): string {
  const base = iso ?? formatTodayIsoInTz();
  const dow = getDayOfWeekInTz(base);
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addDays(base, mondayOffset);
}

export function getWeekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  return addDays(weekStart, deltaWeeks * 7);
}

export function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatWeekRangeLabel(from: string, to: string): string {
  const fromMonth = new Intl.DateTimeFormat("vi-VN", {
    month: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${from}T12:00:00+07:00`));
  const toMonth = new Intl.DateTimeFormat("vi-VN", {
    month: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${to}T12:00:00+07:00`));

  const fromDay = new Intl.DateTimeFormat("vi-VN", { day: "numeric", timeZone: TEACHING_PLAN_TZ }).format(
    new Date(`${from}T12:00:00+07:00`),
  );
  const toDay = new Intl.DateTimeFormat("vi-VN", { day: "numeric", timeZone: TEACHING_PLAN_TZ }).format(
    new Date(`${to}T12:00:00+07:00`),
  );

  if (fromMonth === toMonth) {
    const monthYear = new Intl.DateTimeFormat("vi-VN", {
      month: "long",
      year: "numeric",
      timeZone: TEACHING_PLAN_TZ,
    }).format(new Date(`${from}T12:00:00+07:00`));
    return `${fromDay} – ${toDay} ${monthYear}`;
  }

  const fromLabel = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${from}T12:00:00+07:00`));
  const toLabel = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${to}T12:00:00+07:00`));
  return `${fromLabel} – ${toLabel}`;
}

export function formatDaySectionLabel(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${iso}T12:00:00+07:00`));
}

export function sessionDayKey(startAt: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TEACHING_PLAN_TZ }).format(new Date(startAt));
}

export function isTodayIso(iso: string): boolean {
  return iso === formatTodayIsoInTz();
}

export type DayScheduleGroup = {
  date: string;
  sessions: ClassSessionRecord[];
};

export function groupSessionsByDay(sessions: ClassSessionRecord[], weekDays: string[]): DayScheduleGroup[] {
  const map = new Map<string, ClassSessionRecord[]>();
  weekDays.forEach((day) => map.set(day, []));

  sessions.forEach((session) => {
    const key = sessionDayKey(session.startAt);
    if (map.has(key)) {
      map.get(key)!.push(session);
    }
  });

  return weekDays.map((date) => ({
    date,
    sessions: (map.get(date) ?? []).sort((a, b) => a.startAt.localeCompare(b.startAt)),
  }));
}

export function defaultDatetimeLocalForDay(iso: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${iso}T${hh}:${mm}`;
}
