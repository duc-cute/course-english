import { MenuItem, TextField } from "@mui/material";
import { Controller, type Control, type FieldValues, type RegisterOptions } from "react-hook-form";

type Option = { label: string; value: string };

type SelectFieldProps = {
  name: string;
  control: Control<FieldValues>;
  rules?: RegisterOptions;
  label?: string;
  options?: Option[];
} & React.ComponentProps<typeof TextField>;

export function SelectField({
  name,
  control,
  rules,
  label,
  options = [],
  ...props
}: SelectFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          select
          label={label}
          value={field.value ?? ""}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          {...props}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
