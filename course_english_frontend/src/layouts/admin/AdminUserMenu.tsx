import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useEffect, useId, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { paths } from "../../shared/constants/paths";
import { ProfileAvatar } from "../../shared/ui/ProfileAvatar";
import { initialsFromDisplayName } from "../../student/shared/auth/studentInitials";
import { performStudentLogout } from "../../student/shared/auth/studentLogout";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";

function truncateIdentity(email: string | null, maxLen = 22): string {
  if (!email) return "Quản trị viên";
  if (email.length <= maxLen) return email;
  return `${email.slice(0, maxLen)}…`;
}

function adminInitials(name: string): string {
  const initials = initialsFromDisplayName(name);
  return initials === "HS" ? "QT" : initials;
}

export function AdminUserMenu() {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { displayName, email, avatarUrl } = useStudentAccountProfile();
  const initials = adminInitials(displayName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      </button>

      {open ? (
        <div id={menuId} className="admin-user-menu__panel" role="menu">
          <div className="admin-user-menu__identity">
            <div className="admin-user-menu__meta">
              <p className="admin-user-menu__name">{displayName}</p>
              <p className="admin-user-menu__email">Quản trị viên • {truncateIdentity(email)}</p>
            </div>
          </div>

          <div className="admin-user-menu__menu">
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
