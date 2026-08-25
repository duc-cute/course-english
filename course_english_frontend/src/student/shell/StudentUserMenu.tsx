import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useEffect, useId, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { paths, studentRoutePaths } from "../../shared/constants/paths";
import { ProfileAvatar } from "../../shared/ui/ProfileAvatar";
import { buildDailyGoals } from "../home/dailyGoalsUtils";
import { useStudentAccountProfile } from "../shared/auth/useStudentAccountProfile";
import { initialsFromDisplayName } from "../shared/auth/studentInitials";
import { performStudentLogout } from "../shared/auth/studentLogout";
import { useOptionalStudentDashboard } from "./StudentDashboardContext";

function truncateIdentity(email: string | null, maxLen = 22): string {
  if (!email) return "Học sinh";
  if (email.length <= maxLen) return email;
  return `${email.slice(0, maxLen)}…`;
}

export function StudentUserMenu() {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { displayName, email, avatarUrl } = useStudentAccountProfile();
  const initials = initialsFromDisplayName(displayName);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dashboard = useOptionalStudentDashboard();

  const goals = buildDailyGoals(dashboard?.continueProgress ?? null, dashboard?.practiceSummary ?? {});
  const goalsDone = goals.filter((goal) => goal.done).length;
  const showStats = open && Boolean(dashboard) && !dashboard.loading;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    performStudentLogout(dispatch);
    navigate(`/${paths.LOGIN}`, { replace: true });
  }

  return (
    <div className="student-vq-user-menu" ref={rootRef}>
      <button
        type="button"
        className="student-vq-user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Menu tài khoản"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          className="student-vq-user-menu__avatar"
          hasImageClassName="student-vq-user-menu__avatar--has-image"
          imgClassName="student-vq-user-menu__avatar-img"
        />
      </button>

      {open ? (
        <div id={menuId} className="student-vq-user-menu__panel" role="menu">
          <div className="student-vq-user-menu__identity">
            <div className="student-vq-user-menu__meta">
              <p className="student-vq-user-menu__name">{displayName}</p>
              <p className="student-vq-user-menu__email">Học sinh • {truncateIdentity(email)}</p>
            </div>
          </div>

          {showStats ? (
            <div className="student-vq-user-menu__stats" aria-label="Thống kê nhanh">
              <div className="student-vq-user-menu__stat student-vq-user-menu__stat--lessons">
                <span className="student-vq-user-menu__stat-emoji" aria-hidden>📚</span>
                <span className="student-vq-user-menu__stat-label">Bài học</span>
                <span className="student-vq-user-menu__stat-value">{dashboard?.stats.lessonsCompleted ?? 0} Bài</span>
              </div>
              <div className="student-vq-user-menu__stat student-vq-user-menu__stat--goal">
                <span className="student-vq-user-menu__stat-emoji" aria-hidden>🎯</span>
                <span className="student-vq-user-menu__stat-label">Mục tiêu</span>
                <span className="student-vq-user-menu__stat-value">{goalsDone}/{goals.length}</span>
              </div>
            </div>
          ) : null}

          <div className="student-vq-user-menu__menu">
            <button
              type="button"
              className="student-vq-user-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="student-vq-user-menu__item-emoji" aria-hidden>
                📣
              </span>
              Mời bạn bè cùng học
            </button>
            <Link
              to={studentRoutePaths.profile}
              className="student-vq-user-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="student-vq-user-menu__item-emoji" aria-hidden>
                ⚙️
              </span>
              Cài đặt tài khoản
            </Link>
            <button
              type="button"
              className="student-vq-user-menu__item student-vq-user-menu__item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
