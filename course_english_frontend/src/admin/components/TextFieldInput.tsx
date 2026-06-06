import { TextField } from "@mui/material";
import { useEffect, useRef } from "react";
import { Controller, type Control, type FieldValues, type RegisterOptions } from "react-hook-form";

type TextFieldInputProps = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  label?: string;
  rules?: RegisterOptions;
  handleChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  debounceTime?: number;
  hideLabel?: boolean;
} & React.ComponentProps<typeof TextField>;

export function TextFieldInput({
  name,
  control,
  label,
  rules,
  handleChange,
  debounceTime = 300,
  hideLabel = false,
  ...props
}: TextFieldInputProps) {
  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: "100%" }}>
      {!hideLabel && label ? (
        <label htmlFor={name} style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
          {label}
        </label>
      ) : null}
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            {...props}
            id={name}
            label={hideLabel ? label : undefined}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            size="small"
            onChange={(event) => {
              field.onChange(event);
              if (!handleChange) {
                return;
              }
              if (debounceTimeoutRef.current) {
                window.clearTimeout(debounceTimeoutRef.current);
              }
              debounceTimeoutRef.current = window.setTimeout(() => {
                handleChange(event);
              }, debounceTime);
            }}
          />
        )}
      />
    </div>
  );
}
