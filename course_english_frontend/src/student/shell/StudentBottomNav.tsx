import { useLocation, useNavigate } from "react-router-dom";
import { isStudentNavActive, studentNavItems } from "./studentNavItems";

export function StudentBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = studentNavItems.filter((item) => item.showInBottomNav);

  return (
    <nav className="student-vq-bottom-nav" aria-label="Điều hướng chính">
      {items.map((item) => {
        const active = isStudentNavActive(location.pathname, item.to);
        return (
          <button
            key={item.id}
            type="button"
            className={`student-vq-bottom-nav__item${active ? " is-active" : ""}`}
            onClick={() => navigate(item.to)}
          >
            <span className="student-vq-bottom-nav__icon">{item.icon}</span>
            <span>{item.bottomNavLabel ?? item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
