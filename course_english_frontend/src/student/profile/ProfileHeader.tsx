import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/user/userSlice";
import { clearAccessToken } from "../../shared/auth/token";
import { paths } from "../../shared/constants/paths";
import { getStudentAccountInfo } from "../shared/auth/getStudentAccountInfo";
import { useStudentEnrollments } from "../lessons/useStudentEnrollments";
import { MascotAvatar, VqButton } from "../ui";
import type { StudentStats } from "./studentStats";

type ProfileHeaderProps = {
  stats: StudentStats;
};

export function ProfileHeader({ stats }: ProfileHeaderProps) {
  const { displayName, email } = getStudentAccountInfo();
  const { classrooms, loading: enrollmentLoading } = useStudentEnrollments();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    clearAccessToken();
    dispatch(logout());
    navigate(`/${paths.LOGIN}`, { replace: true });
  }

  return (
    <header className="vq-profile-header">
      <div className="vq-profile-header__identity">
        <MascotAvatar className="vq-profile-header__avatar" />
        <div className="vq-profile-header__info">
          <h1 className="vq-profile-header__name">{displayName}</h1>
          {email ? <p className="vq-profile-header__email">{email}</p> : null}
          {!enrollmentLoading && classrooms.length > 0 ? (
            <div className="vq-profile-header__classrooms">
              {classrooms.map((room) => (
                <span key={room.classroomId} className="vq-profile-header__chip">
                  {room.classroomName}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="vq-profile-header__stats">
        <div className="vq-profile-stat vq-profile-stat--xp">
          <span className="vq-profile-stat__value">{stats.xp}</span>
          <span className="vq-profile-stat__label">XP</span>
        </div>
        <div className="vq-profile-stat vq-profile-stat--streak">
          <span className="vq-profile-stat__value">
            {stats.weeklyStreakCount > 0 ? stats.weeklyStreakCount : "—"}
          </span>
          <span className="vq-profile-stat__label">Ngày tuần này</span>
        </div>
      </div>

      <VqButton variant="ghost" size="sm" className="vq-profile-header__logout" onClick={handleLogout}>
        <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
        Đăng xuất
      </VqButton>
    </header>
  );
}
