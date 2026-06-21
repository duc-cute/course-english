import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { CircularProgress } from "@mui/material";
import { Link } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqButton, VqCard } from "../ui";
import { HomeBadgesPreview } from "./HomeBadgesPreview";
import { HomeContinueCard } from "./HomeContinueCard";
import { HomeDailyGoals } from "./HomeDailyGoals";
import { HomeWeeklyStreak } from "./HomeWeeklyStreak";
import { HomeLevelBar } from "./HomeLevelBar";
import { StudentHeaderStats } from "../shell/StudentHeaderStats";
import { useStudentDashboard } from "../shell/StudentDashboardContext";

export function HomePage() {
  const {
    continueProgress,
    continuePractice,
    weeklyDays,
    weeklyStreakCount,
    stats,
    practiceSummary,
    loading,
  } = useStudentDashboard();

  return (
    <div className="vq-page vq-home">
      {loading ? (
        <div className="vq-home-loading">
          <CircularProgress size={32} />
        </div>
      ) : null}

      {!loading ? (
        <div className="vq-home-mobile-header-zone">
          <StudentHeaderStats
            stats={stats}
            continueProgress={continueProgress}
            practiceSummary={practiceSummary}
            variant="mobile-cards"
          />
          <HomeLevelBar xp={stats.xp} className="vq-home-level--mobile" />
        </div>
      ) : null}

      <div className="vq-home-bento">
        {continueProgress ? (
          <div className="vq-home-bento__continue">
            <HomeContinueCard progress={continueProgress} practiceLatest={continuePractice} />
          </div>
        ) : (
          <div className="vq-home-bento__continue">
            <VqCard title="Bắt đầu học" tone="primary" className="vq-home-start">
              <p>Chọn một bài học để bắt đầu hành trình tiếng Anh của bạn.</p>
              <Link to={studentRoutePaths.lessons} className="vq-home-start__action">
                <VqButton size="lg">
                  <PlayArrowIcon sx={{ fontSize: 20 }} />
                  Xem bài học
                </VqButton>
              </Link>
            </VqCard>
          </div>
        )}

        <div className="vq-home-bento__goals">
          <HomeDailyGoals
            continueProgress={continueProgress}
            practiceSummary={practiceSummary}
          />
        </div>

        <div className="vq-home-bento__weekly">
          <HomeWeeklyStreak days={weeklyDays} weeklyStreakCount={weeklyStreakCount} />
        </div>

        <div className="vq-home-bento__badges">
          <HomeBadgesPreview stats={stats} />
        </div>
      </div>
    </div>
  );
}
