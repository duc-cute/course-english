import type { SxProps, Theme } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { APP_TIME_FORMAT, formatTimeHHmm, parseTimeHHmm } from "./datetimeLocalBridge";

export type AppTimePickerProps = {
  label: string;
  /** Giá trị `HH:mm` (24h). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

/** Chỉ giờ/phút 24h — MUI X, `ampm={false}`. */
export function AppTimePicker({ label, value, onChange, disabled, sx }: AppTimePickerProps) {
  return (
    <TimePicker
      label={label}
      ampm={false}
      format={APP_TIME_FORMAT}
      value={parseTimeHHmm(value)}
      onChange={(next) => onChange(formatTimeHHmm(next))}
      disabled={disabled}
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
