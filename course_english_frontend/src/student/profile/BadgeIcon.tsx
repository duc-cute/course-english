import { BadgeGraphic } from "./BadgeGraphic";
import type { BadgeDefinition, BadgeTone } from "./badges";

type BadgeIconProps = {
  badge: BadgeDefinition;
  unlocked: boolean;
  size?: "sm" | "md";
};

export function BadgeIcon({ badge, unlocked, size = "md" }: BadgeIconProps) {
  const tone: BadgeTone = unlocked ? badge.tone : "muted";
  const className = [
    "vq-profile-badge",
    `vq-profile-badge--${tone}`,
    size === "sm" ? "vq-profile-badge--sm" : "",
    unlocked ? "" : "vq-profile-badge--locked",
  ]
    .filter(Boolean)
    .join(" ");

  const pixelSize = size === "sm" ? 64 : 80;

  return (
    <div className={className} title={`${badge.title}: ${badge.description}`}>
      <BadgeGraphic id={badge.id} unlocked={unlocked} size={pixelSize} />
    </div>
  );
}
