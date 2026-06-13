import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./ui.css";

type VqButtonVariant = "primary" | "ghost";
type VqButtonSize = "sm" | "md" | "lg";

type VqButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: VqButtonVariant;
  size?: VqButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function VqButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...rest
}: VqButtonProps) {
  const classes = [
    "vq-btn",
    `vq-btn--${variant}`,
    `vq-btn--${size}`,
    fullWidth ? "vq-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
