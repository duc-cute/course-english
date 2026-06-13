import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import type { ReactNode } from "react";
import { paths, studentRoutePaths } from "../../shared/constants/paths";

export type StudentNavItem = {
  id: string;
  label: string;
  to: string;
  icon: ReactNode;
  bottomNavLabel?: string;
  showInSidebar: boolean;
  showInBottomNav: boolean;
};

export const STUDENT_APP_TITLE = "Course English";

export const studentNavItems: StudentNavItem[] = [
  {
    id: "home",
    label: "Trang chủ",
    bottomNavLabel: "Home",
    to: studentRoutePaths.home,
    icon: <DashboardCustomizeOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    id: "path",
    label: "Lộ trình",
    bottomNavLabel: "Path",
    to: studentRoutePaths.path,
    icon: <MapOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    id: "lessons",
    label: "Bài học",
    bottomNavLabel: "Lessons",
    to: studentRoutePaths.lessons,
    icon: <ArticleOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: false,
  },
  {
    id: "vocab",
    label: "Từ vựng",
    bottomNavLabel: "Vocab",
    to: studentRoutePaths.vocab,
    icon: <MenuBookOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    id: "leaderboard",
    label: "Xếp hạng",
    bottomNavLabel: "Rank",
    to: studentRoutePaths.leaderboard,
    icon: <LeaderboardOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    id: "profile",
    label: "Hồ sơ",
    bottomNavLabel: "Profile",
    to: studentRoutePaths.profile,
    icon: <PersonOutlineOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    id: "usage-guide",
    label: "Hướng dẫn",
    to: studentRoutePaths.usageGuide,
    icon: <HelpOutlineOutlinedIcon />,
    showInSidebar: true,
    showInBottomNav: false,
  },
];

export function isStudentNavActive(pathname: string, to: string): boolean {
  if (to === studentRoutePaths.home) {
    return pathname === studentRoutePaths.home;
  }
  if (to === studentRoutePaths.vocab) {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Lesson reader uses player shell — excluded from app nav highlight on list route only. */
export function isStudentLessonPlayerPath(pathname: string): boolean {
  const prefix = `/${paths.STUDENT}/${paths.STUDENT_LESSONS}/`;
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}
