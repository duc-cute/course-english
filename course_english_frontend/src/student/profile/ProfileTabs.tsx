export type ProfileTabId = "overview" | "badges" | "history";

type ProfileTabsProps = {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
};

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "badges", label: "Huy hiệu" },
  { id: "history", label: "Lịch sử" },
];

export function ProfileTabs({ active, onChange }: ProfileTabsProps) {
  return (
    <nav className="vq-profile-tabs" aria-label="Tab hồ sơ">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`vq-profile-tabs__item${active === tab.id ? " vq-profile-tabs__item--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
