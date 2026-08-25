import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { useEffect, useId, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { paths } from "../../shared/constants/paths";
import { ProfileAvatar } from "../../shared/ui/ProfileAvatar";
import { initialsFromDisplayName } from "../../student/shared/auth/studentInitials";
import { performStudentLogout } from "../../student/shared/auth/studentLogout";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";
import { getAccessToken } from "../../shared/auth/token";
import { getRolesFromAccessToken } from "../../shared/auth/jwtUtils";

function adminInitials(name: string): string {
  const initials = initialsFromDisplayName(name);
  return initials === "HS" ? "QT" : initials;
}

export function AdminUserMenu() {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { displayName, avatarUrl } = useStudentAccountProfile();
  const initials = adminInitials(displayName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = getAccessToken();
  const roles = token ? getRolesFromAccessToken(token) : [];
  const isTeacher = roles.includes("TEACHER_ROLE") || roles.includes("TEACHER") || roles.some(r => r.toUpperCase() === "TEACHER_ROLE" || r.toUpperCase() === "TEACHER");
  const roleName = isTeacher ? "Giáo viên" : "Quản trị viên";

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
    <div className="admin-user-menu" ref={rootRef}>
      <button
        type="button"
        className="admin-user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Menu tài khoản"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          className="admin-user-menu__avatar"
          hasImageClassName="admin-user-menu__avatar--has-image"
          imgClassName="admin-user-menu__avatar-img"
        />
        <div className="admin-user-menu__trigger-info">
          <span className="admin-user-menu__trigger-name">{displayName}</span>
          <span className="admin-user-menu__trigger-role">{roleName}</span>
        </div>
        <KeyboardArrowDownIcon className="admin-user-menu__trigger-arrow" />
      </button>

      {open ? (
        <div id={menuId} className="admin-user-menu__panel" role="menu">
          <div className="admin-user-menu__identity">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              className="admin-user-menu__avatar admin-user-menu__panel-avatar"
              hasImageClassName="admin-user-menu__avatar--has-image"
              imgClassName="admin-user-menu__avatar-img"
            />
            <div className="admin-user-menu__meta">
              <p className="admin-user-menu__name">{displayName}</p>
              <p className="admin-user-menu__email">{roleName}</p>
            </div>
          </div>

          <div className="admin-user-menu__menu">
            <button
              type="button"
              className="admin-user-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(`/${paths.STUDENT}/${paths.STUDENT_PROFILE}`);
              }}
            >
              <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              Hồ sơ cá nhân
            </button>
            <button
              type="button"
              className="admin-user-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(`/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`);
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
              Cài đặt
            </button>
            <button
              type="button"
              className="admin-user-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(`/${paths.ADMIN}/${paths.USAGE_GUIDE}`);
              }}
            >
              <HelpOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              Trợ giúp
            </button>
            
            <div className="admin-user-menu__divider" />

            <button
              type="button"
              className="admin-user-menu__item admin-user-menu__item--danger"
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
