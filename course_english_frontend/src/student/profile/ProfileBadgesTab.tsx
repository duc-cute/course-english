import { BADGE_DEFINITIONS, countUnlockedBadges } from "./badges";
import { BadgeIcon } from "./BadgeIcon";
import type { StudentStats } from "./studentStats";

type ProfileBadgesTabProps = {
  stats: StudentStats;
};

export function ProfileBadgesTab({ stats }: ProfileBadgesTabProps) {
  const unlockedCount = countUnlockedBadges(stats);

  return (
    <div className="vq-profile-badges-tab">
      <p className="vq-profile-badges-tab__summary">
        Đã mở <strong>{unlockedCount}</strong> / {BADGE_DEFINITIONS.length} huy hiệu
      </p>
      <ul className="vq-profile-badge-list">
        {BADGE_DEFINITIONS.map((badge) => {
          const unlocked = badge.isUnlocked(stats);
          return (
            <li
              key={badge.id}
              className={`vq-profile-badge-card${unlocked ? " vq-profile-badge-card--unlocked" : ""}`}
            >
              <BadgeIcon badge={badge} unlocked={unlocked} />
              <div className="vq-profile-badge-card__body">
                <h3 className="vq-profile-badge-card__title">{badge.title}</h3>
                <p className="vq-profile-badge-card__desc">{badge.description}</p>
              </div>
              <span className="vq-profile-badge-card__status">{unlocked ? "Đã mở" : "Chưa mở"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
