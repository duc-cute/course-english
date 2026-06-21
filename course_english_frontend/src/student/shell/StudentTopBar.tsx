import { useLocation } from "react-router-dom";
import { getStudentPageTitle } from "../../layouts/student/studentPageMeta";
import { studentRoutePaths } from "../../shared/constants/paths";
import { getStudentDisplayName } from "../shared/auth/getStudentDisplayName";
import { HomeLevelBar } from "../home/HomeLevelBar";
import { MascotAvatar } from "../ui";
import { NotificationBell } from "../notifications/NotificationBell";
import { useStudentDashboard } from "./StudentDashboardContext";
import { StudentHeaderStats } from "./StudentHeaderStats";
import { StudentSidebarMenuButton } from "./StudentSidebar";
import { StudentUserMenu } from "./StudentUserMenu";

type StudentTopBarProps = {
  onOpenMenu: () => void;
};

function getCallName(displayName: string): string {
  if (displayName === "bạn") return displayName;
  const parts = displayName.trim().split(/\s+/);
  if (parts.length > 1) return parts[parts.length - 1]!;
  const word = parts[0]!;
  if (/^\d/.test(word) || word.length > 12) {
    return word.slice(0, 8) + (word.length > 8 ? "…" : "");
  }
  return word;
}

function buildGreetingSubtitle(streakCount: number): string {
  if (streakCount <= 0) {
    return "Học 1 bài hôm nay để bắt đầu Streak nhé. 🔥";
  }
  return "Học thêm 1 bài để giữ Streak nhé. 🔥";
}

export function StudentTopBar({ onOpenMenu }: StudentTopBarProps) {
  const location = useLocation();
  const isHome = location.pathname === studentRoutePaths.home;
  const title = getStudentPageTitle(location.pathname);
  const dashboard = useStudentDashboard();

  if (isHome) {
    const name = getStudentDisplayName();
    const callName = getCallName(name);
    const greeting =
      callName === "bạn" ? "Xin chào! 👋" : `Xin chào, ${callName}! 👋`;
    const greetingSub = "Hôm nay là một ngày tuyệt vời để học!";

    const statsProps = {
      stats: dashboard.stats,
      continueProgress: dashboard.continueProgress,
      practiceSummary: dashboard.practiceSummary,
    };

    return (
      <header className="student-vq-topbar student-vq-topbar--home">
        <div className="student-vq-home-header-card">
          {/* Row 1 — mobile/tablet: greet | streak + avatar; desktop: + stats giữa */}
          <div className="student-vq-home-header-card__top">
            <div className="student-vq-home-header-card__greet">
              <StudentSidebarMenuButton onOpen={onOpenMenu} />
              <div className="student-vq-topbar__mascot-wrap">
                <span className="student-vq-topbar__mascot" aria-hidden>🤖</span>
                <span className="student-vq-topbar__mascot-ping-wrap" aria-hidden>
                  <span className="student-vq-topbar__mascot-ping" />
                  <span className="student-vq-topbar__mascot-ping-dot" />
                </span>
              </div>
              <div className="student-vq-topbar__greeting-text">
                <p className="student-vq-topbar__greeting-title">{greeting}</p>
                <p className="student-vq-topbar__greeting-sub">{greetingSub}</p>
              </div>
            </div>

            {!dashboard.loading ? (
              <StudentHeaderStats
                {...statsProps}
                variant="full"
                className="student-vq-header-stats--desktop"
              />
            ) : null}

            <div className="student-vq-topbar__actions">
              {!dashboard.loading ? (
                <StudentHeaderStats
                  {...statsProps}
                  variant="streak-only"
                  className="student-vq-header-stats--compact"
                />
              ) : null}
              <NotificationBell />
              <StudentUserMenu />
            </div>
          </div>

          {/* Row 2 — level bar */}
          {!dashboard.loading ? <HomeLevelBar xp={dashboard.stats.xp} className="vq-home-level--desktop" /> : null}
        </div>
      </header>
    );
  }

  return (
    <header className="student-vq-topbar">
      <div className="student-vq-topbar__left">
        <StudentSidebarMenuButton onOpen={onOpenMenu} />
        <h1 className="student-vq-topbar__title">{title}</h1>
      </div>
      <div className="student-vq-topbar__actions">
        <NotificationBell />
        <StudentUserMenu />
      </div>
    </header>
  );
}
