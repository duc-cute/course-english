import { BADGE_DEFINITIONS, countUnlockedBadges } from "./badges";
import { BadgeIcon } from "./BadgeIcon";
import type { StudentStats } from "./studentStats";

type ProfileBadgesTabProps = {
  stats: StudentStats;
};

const CATEGORIES = [
  { id: "study", label: "Huy hiệu học tập", icon: "📖" },
  { id: "streak", label: "Huy hiệu streak", icon: "🔥" },
  { id: "xp", label: "Huy hiệu XP", icon: "⭐" },
  { id: "special", label: "Huy hiệu đặc biệt", icon: "🌟" },
] as const;

export function ProfileBadgesTab({ stats }: ProfileBadgesTabProps) {
  const unlockedCount = countUnlockedBadges(stats);

  return (
    <div className="vq-profile-badges-tab">
      <div className="vq-profile-badges-tab__header">
        <h2 className="vq-profile-badges-tab__title">Bộ huy hiệu</h2>
        <p className="vq-profile-badges-tab__summary">
          Đã mở khóa <strong>{unlockedCount}</strong> / {BADGE_DEFINITIONS.length} huy hiệu
        </p>
      </div>

      <div className="vq-profile-badge-sections">
        {CATEGORIES.map((cat) => {
          const badges = BADGE_DEFINITIONS.filter((b) => b.category === cat.id);
          return (
            <section key={cat.id} className="vq-profile-badge-section">
              <h3 className="vq-profile-badge-section__title">
                <span className="vq-profile-badge-section__icon" aria-hidden>{cat.icon}</span>{" "}
                {cat.label}
              </h3>
              <div className="vq-profile-badge-grid">
                {badges.map((badge) => {
                  const unlocked = badge.isUnlocked(stats);
                  return (
                    <div
                      key={badge.id}
                      className={`vq-profile-badge-item${unlocked ? " vq-profile-badge-item--unlocked" : ""}`}
                    >
                      <BadgeIcon badge={badge} unlocked={unlocked} />
                      <div className="vq-profile-badge-item__body">
                        <h4 className="vq-profile-badge-item__title">{badge.title}</h4>
                        <p className="vq-profile-badge-item__desc">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
