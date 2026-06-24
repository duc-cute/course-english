import type { SxProps, Theme } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  APP_DATETIME_FORMAT,
  formatDatetimeLocal,
  parseDatetimeLocal,
} from "./datetimeLocalBridge";

export type AppDateTimePickerProps = {
  label: string;
  /** Giá trị `YYYY-MM-DDTHH:mm` (giờ VN, cùng format teachingPlanUtils). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDateTime?: string;
  sx?: SxProps<Theme>;
};

/** Date + time 24h — MUI X, `ampm={false}`. */
export function AppDateTimePicker({
  label,
  value,
  onChange,
  disabled,
  minDateTime,
  sx,
}: AppDateTimePickerProps) {
  return (
    <DateTimePicker
      label={label}
      ampm={false}
      format={APP_DATETIME_FORMAT}
      value={parseDatetimeLocal(value)}
      onChange={(next) => onChange(formatDatetimeLocal(next))}
      disabled={disabled}
      minDateTime={minDateTime ? parseDatetimeLocal(minDateTime) ?? undefined : undefined}
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
          sx,
        },
        field: { clearable: true },
      }}
    />
  );
}
