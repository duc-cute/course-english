import { NavLink } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";

export function LessonsViewTabs() {
  return (
    <nav className="vq-lessons-tabs" aria-label="Chế độ xem bài học">
      <NavLink
        to={studentRoutePaths.lessons}
        className={({ isActive }) => `vq-lessons-tabs__item${isActive ? " vq-lessons-tabs__item--active" : ""}`}
        end
      >
        Danh sách
      </NavLink>
      <NavLink
        to={studentRoutePaths.path}
        className={({ isActive }) => `vq-lessons-tabs__item${isActive ? " vq-lessons-tabs__item--active" : ""}`}
      >
        Lộ trình
      </NavLink>
    </nav>
  );
}
