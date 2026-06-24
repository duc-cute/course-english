import type { Dayjs } from "dayjs";
import { APP_TIMEZONE, dayjs } from "./dayjsConfig";

export const APP_DATETIME_FORMAT = "DD/MM/YYYY HH:mm";
export const APP_TIME_FORMAT = "HH:mm";
export const DATETIME_LOCAL_PATTERN = "YYYY-MM-DDTHH:mm";

/** `YYYY-MM-DDTHH:mm` (giờ VN) → Dayjs */
export function parseDatetimeLocal(value: string | null | undefined): Dayjs | null {
  if (!value?.trim()) return null;
  const parsed = dayjs.tz(value, DATETIME_LOCAL_PATTERN, APP_TIMEZONE);
  return parsed.isValid() ? parsed : null;
}

export function formatDatetimeLocal(value: Dayjs | null): string {
  if (!value?.isValid()) return "";
  return value.tz(APP_TIMEZONE).format(DATETIME_LOCAL_PATTERN);
}

/** `HH:mm` → Dayjs (anchor hôm nay, chỉ dùng giờ/phút) */
export function parseTimeHHmm(value: string | null | undefined): Dayjs | null {
  if (!value?.trim()) return null;
  const parsed = dayjs.tz(`1970-01-01T${value.slice(0, 5)}`, DATETIME_LOCAL_PATTERN, APP_TIMEZONE);
  return parsed.isValid() ? parsed : null;
}

export function formatTimeHHmm(value: Dayjs | null): string {
  if (!value?.isValid()) return "";
  return value.format(APP_TIME_FORMAT);
}
