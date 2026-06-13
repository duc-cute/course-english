import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import { Link } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { HomeWeeklyStreak } from "../home/HomeWeeklyStreak";
import { VqCard } from "../ui";
import type { StudentStats } from "./studentStats";

type ProfileOverviewTabProps = {
  stats: StudentStats;
};

export function ProfileOverviewTab({ stats }: ProfileOverviewTabProps) {
  return (
    <div className="vq-profile-overview">
      <div className="vq-profile-metrics">
        <article className="vq-profile-metric">
          <MenuBookOutlinedIcon className="vq-profile-metric__icon" />
          <span className="vq-profile-metric__value">{stats.lessonsReadComplete}</span>
          <span className="vq-profile-metric__label">Bài đọc xong</span>
        </article>
        <article className="vq-profile-metric">
          <CheckCircleOutlineIcon className="vq-profile-metric__icon" />
          <span className="vq-profile-metric__value">{stats.practicePassedCount}</span>
          <span className="vq-profile-metric__label">Bài tập pass</span>
        </article>
        <article className="vq-profile-metric">
          <ReplayOutlinedIcon className="vq-profile-metric__icon" />
          <span className="vq-profile-metric__value">{stats.totalAttempts}</span>
          <span className="vq-profile-metric__label">Lần làm bài</span>
        </article>
        <article className="vq-profile-metric">
          <MenuBookOutlinedIcon className="vq-profile-metric__icon" />
          <span className="vq-profile-metric__value">{stats.lessonsCompleted}</span>
          <span className="vq-profile-metric__label">Bài hoàn thành</span>
        </article>
      </div>

      <VqCard title="Streak tuần này" className="vq-profile-panel">
        <HomeWeeklyStreak days={stats.weeklyDays} />
      </VqCard>

      <VqCard title="Tiếp tục học" tone="primary" className="vq-profile-panel">
        <p className="vq-profile-panel__hint">
          Bạn đã bắt đầu {stats.lessonsStarted} bài trong lớp của mình. Tiếp tục lộ trình để mở thêm huy hiệu nhé!
        </p>
        <Link to={studentRoutePaths.lessons} className="vq-profile-panel__link">
          Xem bài học →
        </Link>
      </VqCard>
    </div>
  );
}
