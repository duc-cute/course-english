import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { BADGE_DEFINITIONS } from "../profile/badges";
import { BadgeIcon } from "../profile/BadgeIcon";
import type { StudentStats } from "../profile/studentStats";

type HomeBadgesPreviewProps = {
  stats: StudentStats;
};

const PREVIEW_COUNT = 4;

export function HomeBadgesPreview({ stats }: HomeBadgesPreviewProps) {
  const unlocked = BADGE_DEFINITIONS.filter((badge) => badge.isUnlocked(stats));
  const locked = BADGE_DEFINITIONS.filter((badge) => !badge.isUnlocked(stats));
  const preview = [
    ...unlocked.slice(0, PREVIEW_COUNT),
    ...locked.slice(0, Math.max(0, PREVIEW_COUNT - unlocked.length)),
  ].slice(0, PREVIEW_COUNT);

  return (
    <article className="vq-home-panel vq-home-panel--badges">
      <div className="vq-home-panel__head">
        <h3 className="vq-home-panel__title">
          <span className="vq-home-panel__title-icon" aria-hidden>🏆</span>
          Huy hiệu
        </h3>
        <Link to={studentRoutePaths.profile} className="vq-home-badges__see-all">
          Xem tất cả &gt;
        </Link>
      </div>
      <div className="vq-home-badges">
        {preview.map((badge) => {
          const isUnlocked = badge.isUnlocked(stats);
          return (
            <BadgeIcon
              key={badge.id}
              badge={badge}
              unlocked={isUnlocked}
              size="sm"
            />
          );
        })}
        {preview.length === 0 ? (
          <div className="vq-home-badge vq-home-badge--locked" title="Sắp mở">
            <LockOutlinedIcon />
          </div>
        ) : null}
      </div>
    </article>
  );
}