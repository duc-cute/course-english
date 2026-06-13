import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { CircularProgress } from "@mui/material";
import { Link } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqButton, VqCard } from "../ui";
import { HomeBadgesPreview } from "./HomeBadgesPreview";
import { HomeContinueCard } from "./HomeContinueCard";
import { HomeDailyGoals } from "./HomeDailyGoals";
import { HomeHero } from "./HomeHero";
import { HomeQuickLinks } from "./HomeQuickLinks";
import { HomeWeeklyStreak } from "./HomeWeeklyStreak";
import { useHomeDashboard } from "./useHomeDashboard";
import { useStudentStats } from "../profile/useStudentStats";

export function HomePage() {
  const { continueProgress, continuePractice, weeklyDays, loading } = useHomeDashboard();
  const { stats, loading: statsLoading } = useStudentStats();
  const pageLoading = loading || statsLoading;

  return (
    <div className="vq-page vq-home">
      <HomeHero weeklyStreakCount={stats.weeklyStreakCount} xp={stats.xp} />

      {pageLoading ? (
        <div className="vq-home-loading">
          <CircularProgress size={32} />
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
          <HomeDailyGoals continueProgress={continueProgress} />
        </div>

        <div className="vq-home-bento__weekly">
          <HomeWeeklyStreak days={weeklyDays} />
        </div>

        <div className="vq-home-bento__badges">
          <HomeBadgesPreview stats={stats} />
        </div>
      </div>

      <HomeQuickLinks />
    </div>
  );
}
