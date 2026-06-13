import MenuIcon from "@mui/icons-material/Menu";
import { useLocation, useNavigate } from "react-router-dom";
import {
  STUDENT_APP_TITLE,
  isStudentNavActive,
  studentNavItems,
} from "./studentNavItems";

type StudentSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = studentNavItems.filter((item) => item.showInSidebar);

  return (
    <ul className="student-vq-nav">
      {items.map((item) => {
        const active = isStudentNavActive(location.pathname, item.to);
        const Icon = item.icon;
        return (
          <li key={item.id} className="student-vq-nav__item">
            <button
              type="button"
              className={`student-vq-nav__link${active ? " is-active" : ""}`}
              onClick={() => {
                navigate(item.to);
                onNavigate?.();
              }}
            >
              <span className="student-vq-nav__icon">
                <Icon />
              </span>
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function StudentSidebar({ mobileOpen, onClose }: StudentSidebarProps) {
  const sidebarInner = (
    <>
      <div className="student-vq-sidebar__brand">
        <p className="student-vq-sidebar__brand-title">{STUDENT_APP_TITLE}</p>
        <p className="student-vq-sidebar__brand-sub">Khu vực học sinh</p>
      </div>
      <NavList onNavigate={onClose} />
    </>
  );

  return (
    <>
      {mobileOpen ? (
        <>
          <div className="student-vq-drawer-backdrop" onClick={onClose} aria-hidden />
          <aside className="student-vq-drawer" aria-label="Menu học sinh">
            {sidebarInner}
          </aside>
        </>
      ) : null}
      <aside className="student-vq-sidebar" aria-label="Menu học sinh">
        {sidebarInner}
      </aside>
    </>
  );
}

export function StudentSidebarMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="student-vq-topbar__menu-btn" onClick={onOpen} aria-label="Mở menu">
      <MenuIcon />
    </button>
  );
}
