import type { LessonPlayerTab } from "../../shared/lesson/blockTypes";

type LessonPlayerTabsProps = {
  activeTab: LessonPlayerTab;
  onTabChange: (tab: LessonPlayerTab) => void;
  showStudy: boolean;
  showPractice: boolean;
};

export function LessonPlayerTabs({ activeTab, onTabChange, showStudy, showPractice }: LessonPlayerTabsProps) {
  if (!showStudy && !showPractice) return null;
  if (showStudy && !showPractice) return null;

  return (
    <div className="lesson-player-tabs" role="tablist" aria-label="Chế độ bài học">
      {showStudy ? (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "study"}
          className={`lesson-player-tab${activeTab === "study" ? " is-active" : ""}`}
          onClick={() => onTabChange("study")}
        >
          Bài học
        </button>
      ) : null}
      {showPractice ? (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "practice"}
          className={`lesson-player-tab${activeTab === "practice" ? " is-active" : ""}`}
          onClick={() => onTabChange("practice")}
        >
          Bài tập
        </button>
      ) : null}
    </div>
  );
}
