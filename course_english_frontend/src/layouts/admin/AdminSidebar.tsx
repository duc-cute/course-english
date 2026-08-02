import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import AbcOutlinedIcon from "@mui/icons-material/AbcOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EmojiPeopleOutlinedIcon from "@mui/icons-material/EmojiPeopleOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_DRAWER_WIDTH } from "../../theme/academicCore";
import { paths } from "../../shared/constants/paths";
import { BrandLogo } from "../../shared/ui/BrandLogo";
import { ProfileAvatar } from "../../shared/ui/ProfileAvatar";
import { initialsFromDisplayName } from "../../student/shared/auth/studentInitials";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";

type AdminSidebarProps = {
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  onCloseMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
};

type NavItem = {
  label: string;
  icon: ReactNode;
  to: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const ADMIN_MINI_DRAWER_WIDTH = 64;
const ADMIN_HOME = `/${paths.ADMIN}`;

function adminInitials(name: string): string {
  const initials = initialsFromDisplayName(name);
  return initials === "HS" ? "QT" : initials;
}

const drawerPaperSx = (collapsed: boolean) => ({
  width: collapsed ? ADMIN_MINI_DRAWER_WIDTH : ADMIN_DRAWER_WIDTH,
  boxSizing: "border-box" as const,
  borderRight: "1px solid #e2e8f0",
  bgcolor: "#ffffff",
  boxShadow: "none",
  overflow: "hidden",
});

export function AdminSidebar({
  mobileOpen,
  desktopCollapsed,
  onCloseMobileSidebar,
  onToggleDesktopSidebar,
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { displayName, avatarUrl } = useStudentAccountProfile();
  const profileInitials = adminInitials(displayName);

  const navGroups = useMemo<NavGroup[]>(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        items: [
          {
            label: "Tổng quan",
            icon: <DashboardOutlinedIcon />,
            to: ADMIN_HOME,
          },
          {
            label: "Lịch dạy",
            icon: <CalendarTodayOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.SCHEDULE}`,
          },
          {
            label: "Học sinh cần hỗ trợ",
            icon: <PersonSearchOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.STUDENTS_NEED_SUPPORT}`,
          },
        ],
      },
      {
        id: "teaching",
        label: "Giảng dạy",
        items: [
          {
            label: "Quản lý lớp học",
            icon: <SchoolOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_CLASSROOM}`,
          },
          {
            label: "Quản lý môn học",
            icon: <MenuBookOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_SUBJECT}`,
          },
          {
            label: "Quản lý bài học",
            icon: <ArticleOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_LESSON}`,
          },
          {
            label: "Quản lý phân lớp",
            icon: <GroupAddOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_ENROLLMENT}`,
          },
        ],
      },
      {
        id: "materials",
        label: "Học liệu",
        items: [
          {
            label: "Bộ từ vựng",
            icon: <LibraryBooksOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`,
          },
          {
            label: "Thư viện từ",
            icon: <AbcOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_WORDS}`,
          },
          {
            label: "Learning Journey",
            icon: <RouteOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}`,
          },
          {
            label: "Thư viện câu hỏi",
            icon: <QuizOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_QUESTIONS}`,
          },
          {
            label: "AI Reading Studio",
            icon: <AutoStoriesOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_STORIES}`,
          },
          {
            label: "Duyệt tài liệu",
            icon: <DescriptionOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.REVIEW_DOC}`,
          },
        ],
      },
      {
        id: "assessment",
        label: "Đánh giá",
        items: [
          {
            label: "Đề thi / Kiểm tra",
            icon: <AssignmentOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_EXAM_PAPERS}`,
          },
        ],
      },
      {
        id: "ai-tools",
        label: "AI & Công cụ",
        items: [
          {
            label: "AI Assistant",
            icon: <SmartToyOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.AI_ASSISTANT}`,
          },
          {
            label: "Innovation Hub",
            icon: <LightbulbOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.INNOVATION_HUB}`,
          },
          {
            label: "Học RabbitMQ",
            icon: <HubOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.RABBITMQ_LAB}`,
          },
        ],
      },
      {
        id: "system",
        label: "Quản trị",
        items: [
          {
            label: "Quản lý người dùng",
            icon: <PeopleAltIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_USER}`,
          },
          {
            label: "Quản lý vai trò",
            icon: <SecurityIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_ROLE}`,
          },
          {
            label: "Cấu hình hệ thống",
            icon: <SettingsOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`,
          },
          {
            label: "Nhật ký hệ thống",
            icon: <HistoryOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.ACTIVITY_LOGS}`,
          },
          {
            label: "Hướng dẫn sử dụng",
            icon: <HelpOutlineOutlinedIcon />,
            to: `/${paths.ADMIN}/${paths.USAGE_GUIDE}`,
          },
        ],
      },
    ],
    [],
  );

  const isItemActive = (to: string) =>
    location.pathname === to || (to !== ADMIN_HOME && location.pathname.startsWith(to));

  const goTo = (to: string) => {
    navigate(to);
    if (mobileOpen) {
      onCloseMobileSidebar();
    }
  };

  const renderNavButton = (
    label: string,
    icon: ReactNode,
    onClick: () => void,
    isActive = false,
  ) => (
    <ListItemButton
      className={`admin-nav-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      <ListItemIcon className="admin-nav-item-icon">{icon}</ListItemIcon>
      <ListItemText primary={label} className="admin-nav-item-label" />
    </ListItemButton>
  );

  const renderDrawerContent = (collapsed: boolean, showCollapseToggle: boolean) => (
    <Box className={`admin-sidebar-inner ${collapsed ? "collapsed" : ""}`}>
      <Stack direction="row" alignItems="center" className="admin-sidebar-brand">
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <BrandLogo size="sm" />
          <Box sx={{ minWidth: 0 }}>
            <Typography className="admin-sidebar-brand-title" noWrap>
              Nova English
            </Typography>
            <Typography className="admin-sidebar-brand-sub" noWrap>
              Quản trị hệ thống
            </Typography>
          </Box>
        </Stack>
        {showCollapseToggle ? (
          <Tooltip title={collapsed ? "Mở rộng" : "Thu gọn"} placement="right">
            <IconButton
              size="small"
              className="admin-sidebar-collapse-btn"
              onClick={onToggleDesktopSidebar}
              aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      <Box className="admin-sidebar-nav">
        {navGroups.map((group) => (
          <Box key={group.id} className="admin-sidebar-nav-group">
            {!collapsed ? (
              <Typography component="p" className="admin-sidebar-nav-group-label">
                {group.label}
              </Typography>
            ) : null}
            <List disablePadding className="admin-sidebar-nav-list">
              {group.items.map((item) => {
                const isActive = isItemActive(item.to);
                const button = renderNavButton(item.label, item.icon, () => goTo(item.to), isActive);

                if (collapsed) {
                  return (
                    <Tooltip key={item.to} title={item.label} placement="right" arrow enterTouchDelay={0}>
                      {button}
                    </Tooltip>
                  );
                }

                return <Box key={item.to}>{button}</Box>;
              })}
            </List>
          </Box>
        ))}

        <List disablePadding className="admin-sidebar-nav-list admin-sidebar-nav-secondary">
          {(() => {
            const studentButton = renderNavButton("Khu vực học sinh", <EmojiPeopleOutlinedIcon />, () =>
              goTo(`/${paths.STUDENT}`),
            );

            if (collapsed) {
              return (
                <Tooltip title="Khu vực học sinh" placement="right" arrow enterTouchDelay={0}>
                  {studentButton}
                </Tooltip>
              );
            }

            return studentButton;
          })()}
        </List>
      </Box>

      <Box
        className="admin-sidebar-profile"
        role="button"
        tabIndex={0}
        onClick={() => goTo(`/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goTo(`/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`);
          }
        }}
      >
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={profileInitials}
          className="admin-sidebar-profile-avatar"
          hasImageClassName="admin-sidebar-profile-avatar--has-image"
          imgClassName="admin-sidebar-profile-avatar-img"
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="admin-sidebar-profile-name" noWrap>
            {displayName || "Quản trị viên"}
          </Typography>
          <Typography className="admin-sidebar-profile-role" noWrap>
            Quản trị viên
          </Typography>
        </Box>
        <SettingsOutlinedIcon className="admin-sidebar-profile-settings" fontSize="small" />
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobileSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            ...drawerPaperSx(false),
            height: "100%",
          },
        }}
      >
        {renderDrawerContent(false, false)}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        className="admin-sidebar-drawer"
        sx={{
          display: { xs: "none", md: "block" },
          width: desktopCollapsed ? ADMIN_MINI_DRAWER_WIDTH : ADMIN_DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            ...drawerPaperSx(desktopCollapsed),
            position: "relative",
            height: "100vh",
          },
        }}
      >
        {renderDrawerContent(desktopCollapsed, true)}
      </Drawer>
    </>
  );
}

export { ADMIN_DRAWER_WIDTH };
