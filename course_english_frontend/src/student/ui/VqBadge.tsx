import type { ReactNode } from "react";
import "./ui.css";

type VqBadgeTone = "streak" | "xp" | "muted";

type VqBadgeProps = {
  tone?: VqBadgeTone;
  icon?: ReactNode;
  children: ReactNode;
};

export function VqBadge({ tone = "muted", icon, children }: VqBadgeProps) {
  return (
    <span className={`vq-badge vq-badge--${tone}`}>
      {icon}
      {children}
    </span>
  );
}
