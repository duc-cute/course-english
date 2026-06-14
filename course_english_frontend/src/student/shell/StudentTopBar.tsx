import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import { useLocation } from "react-router-dom";
import { getStudentPageTitle } from "../../layouts/student/studentPageMeta";
import { NotificationBell } from "../notifications/NotificationBell";
import { VqBadge } from "../ui";
import { StudentSidebarMenuButton } from "./StudentSidebar";

type StudentTopBarProps = {
  onOpenMenu: () => void;
};

export function StudentTopBar({ onOpenMenu }: StudentTopBarProps) {
  const location = useLocation();
  const title = getStudentPageTitle(location.pathname);

  return (
    <header className="student-vq-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StudentSidebarMenuButton onOpen={onOpenMenu} />
        <h1 className="student-vq-topbar__title">{title}</h1>
      </div>
      <div className="student-vq-topbar__stats">
        <NotificationBell />
        <VqBadge tone="streak" icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: 16 }} />}>
          —
        </VqBadge>
        <VqBadge tone="xp" icon={<StarsOutlinedIcon sx={{ fontSize: 16 }} />}>
          —
        </VqBadge>
      </div>
    </header>
  );
}
