import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import type { ReactNode } from "react";
import type { BadgeDefinition, BadgeId, BadgeTone } from "./badges";

const BADGE_ICONS: Record<BadgeId, ReactNode> = {
  first_lesson: <RocketLaunchOutlinedIcon />,
  on_fire: <LocalFireDepartmentOutlinedIcon />,
  quiz_master: <EmojiEventsOutlinedIcon />,
  perfect: <StarOutlinedIcon />,
  bookworm: <AutoStoriesOutlinedIcon />,
  dedicated: <LocalFireDepartmentOutlinedIcon />,
};

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

  return (
    <div className={className} title={badge.title}>
      {unlocked ? BADGE_ICONS[badge.id] : <LockOutlinedIcon />}
    </div>
  );
}
