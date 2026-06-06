import { Button, type ButtonProps } from "@mui/material";

type AppButtonProps = ButtonProps & {
  minWidth?: number;
  minHeight?: number;
};

export function AppButton({ children, minWidth = 110, minHeight = 40, sx, ...props }: AppButtonProps) {
  return (
    <Button
      sx={{
        minWidth,
        minHeight,
        px: 2,
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
