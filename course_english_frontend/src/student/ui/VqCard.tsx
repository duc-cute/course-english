import type { ReactNode } from "react";
import "./ui.css";

type VqCardProps = {
  title?: string;
  children: ReactNode;
  tone?: "default" | "primary";
  className?: string;
};

export function VqCard({ title, children, tone = "default", className = "" }: VqCardProps) {
  const classes = ["vq-card", tone === "primary" ? "vq-card--primary" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      {title ? <h2 className="vq-card__title">{title}</h2> : null}
      <div className="vq-card__body">{children}</div>
    </article>
  );
}
