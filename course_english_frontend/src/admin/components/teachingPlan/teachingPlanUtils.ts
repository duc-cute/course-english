import type { ClassSessionPayload, SessionType } from "../../shared/api/classSession";

export const TEACHING_PLAN_TZ = "Asia/Ho_Chi_Minh";

const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TEACHING_PLAN_TZ,
};

export function formatSessionTimeRange(startAt: string, endAt: string): string {
  const start = new Intl.DateTimeFormat("vi-VN", TIME_FMT).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("vi-VN", TIME_FMT).format(new Date(endAt));
  return `${start} – ${end}`;
}

export function formatPlanDateLabel(dateStr: string): string {
  const date = dateStr.includes("T") ? new Date(dateStr) : new Date(`${dateStr}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(date);
}

export function formatTodayIsoInTz(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TEACHING_PLAN_TZ }).format(new Date());
}

/** datetime-local for now in VN (minute precision). */
export function nowDatetimeLocalInTz(): string {
  return isoToDatetimeLocal(new Date().toISOString());
}

export const SESSION_DEFAULT_DURATION_MIN = 120;

export function addMinutesToDatetimeLocal(local: string, minutes: number): string {
  if (!local) return "";
  const ms = new Date(datetimeLocalToIso(local)).getTime() + minutes * 60_000;
  return isoToDatetimeLocal(new Date(ms).toISOString());
}

export function mergeDateWithTime(dateIso: string, timeSourceLocal: string): string {
  return `${dateIso}T${extractTimeFromDatetimeLocal(timeSourceLocal)}`;
}

/** So sánh HH:mm — true nếu `end` sau `start` (cùng ngày). */
export function isSessionEndTimeAfterStart(startTime: string, endTime: string): boolean {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  return eh * 60 + em > sh * 60 + sm;
}

export function buildSessionTimes(
  initialDay?: string,
  initialStartHour?: number,
  initialStartMinute?: number,
): { startLocal: string; endLocal: string } {
  const now = nowDatetimeLocalInTz();
  if (!initialDay) {
    return {
      startLocal: now,
      endLocal: addMinutesToDatetimeLocal(now, SESSION_DEFAULT_DURATION_MIN),
    };
  }

  const nowTime = extractTimeFromDatetimeLocal(now);
  const [nowHour, nowMinute] = nowTime.split(":").map(Number);
  const hour = initialStartHour ?? nowHour ?? 0;
  const minute = initialStartMinute ?? nowMinute ?? 0;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const startLocal = `${initialDay}T${time}`;
  return {
    startLocal,
    endLocal: addMinutesToDatetimeLocal(startLocal, SESSION_DEFAULT_DURATION_MIN),
  };
}

export function mergeDayWithTimeHHmm(dayIso: string, timeHHmm: string): string {
  const time = timeHHmm.trim().slice(0, 5);
  return `${dayIso}T${time}`;
}

export function syncSessionEndOnStartDay(startLocal: string, endTimeOrLocal: string): string {
  const day = extractDateFromDatetimeLocal(startLocal);
  const time = endTimeOrLocal.includes("T")
    ? extractTimeFromDatetimeLocal(endTimeOrLocal)
    : endTimeOrLocal.trim().slice(0, 5);
  return mergeDayWithTimeHHmm(day, time);
}

export function formatIsoDateVi(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TEACHING_PLAN_TZ,
  }).format(new Date(`${iso}T12:00:00+07:00`));
}

/** datetime-local value (VN) → ISO UTC for API */
export function datetimeLocalToIso(local: string): string {
  if (!local) return "";
  return new Date(`${local}:00+07:00`).toISOString();
}

/** ISO UTC → datetime-local value in VN */
export function isoToDatetimeLocal(iso: string | undefined | null): string {
  if (!iso) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TEACHING_PLAN_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const DUE_FMT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TEACHING_PLAN_TZ,
};

/** Hiển thị hạn nộp bài (VN) — rỗng nếu không có dueAt */
export function formatDueAtLabel(iso: string | undefined | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", DUE_FMT).format(new Date(iso));
}

export function isDueAtOverdue(iso: string | undefined | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export const SESSION_TYPE_OPTIONS = [
  { value: "LIVE_CLASS", label: "Lớp trực tuyến" },
  { value: "OFFICE_HOURS", label: "Office hours" },
  { value: "EXAM", label: "Kiểm tra" },
  { value: "OTHER", label: "Khác" },
] as const;

export const SESSION_LONG_DURATION_MIN = 60;

export function sessionDurationMinutes(startAt: string, endAt: string): number {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.round(ms / 60_000);
}

export function sessionMeetStatusLabel(session: {
  meetLink?: string | null;
  usePreSavedLink?: boolean;
  uiState?: string;
  canStartOnlineClass?: boolean;
  needsSetup?: boolean;
}): string {
  if (session.usePreSavedLink) return "Link có sẵn";
  if (session.uiState === "WAITING_TEACHER") return "Chờ dán link Meet";
  if (session.canStartOnlineClass || session.needsSetup) return "Chưa bắt đầu lớp";
  if (session.meetLink) return "Đã có link";
  return "Chưa có link";
}

export function sessionSubtitle(session: {
  activeStudentCount?: number;
  locationLabel?: string | null;
  meetLink?: string | null;
  lessonTitle?: string | null;
  lessonId?: string | null;
  usePreSavedLink?: boolean;
  uiState?: string;
  canStartOnlineClass?: boolean;
  needsSetup?: boolean;
}): string {
  const parts: string[] = [];
  if (session.lessonTitle || session.lessonId) {
    parts.push(`Bài: ${session.lessonTitle ?? "Đã gán"}`);
  } else {
    parts.push("Chưa gán bài");
  }
  const count = session.activeStudentCount ?? 0;
  parts.push(`HS active: ${count}`);
  parts.push(sessionMeetStatusLabel(session));
  return parts.join(" • ");
}

export function sessionToUpdatePayload(
  session: {
    classroomId?: string;
    title: string;
    sessionType: SessionType;
    startAt: string;
    endAt: string;
    meetLink?: string | null;
    locationLabel?: string | null;
    notes?: string | null;
    lessonId?: string | null;
  },
  overrides: { lessonId?: string | null } = {},
): ClassSessionPayload | null {
  if (!session.classroomId) return null;
  return {
    classroomId: session.classroomId,
    title: session.title,
    sessionType: session.sessionType,
    startAt: session.startAt,
    endAt: session.endAt,
    meetLink: session.meetLink ?? null,
    locationLabel: session.locationLabel ?? null,
    notes: session.notes ?? null,
    lessonId: overrides.lessonId !== undefined ? overrides.lessonId : (session.lessonId ?? null),
  };
}

export function formatNextClassLabel(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  if (minutes <= 0) return "Sắp bắt đầu";
  if (minutes < 60) return `Còn ${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `Còn ${hours}g ${mins}p` : `Còn ${hours} giờ`;
}

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 7, label: "CN" },
] as const;

export function extractDateFromDatetimeLocal(local: string): string {
  return local.split("T")[0] ?? "";
}

export function extractTimeFromDatetimeLocal(local: string): string {
  const time = local.split("T")[1];
  return time ? time.slice(0, 5) : "19:00";
}

/** Last day of recurring series — mirrors BE: rangeStart + weekCount weeks − 1 day. */
export function recurringRangeEndDate(rangeStart: string, weekCount: number): string {
  const weeks = Math.max(1, weekCount);
  const date = new Date(`${rangeStart}T12:00:00+07:00`);
  date.setDate(date.getDate() + weeks * 7 - 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TEACHING_PLAN_TZ }).format(date);
}
