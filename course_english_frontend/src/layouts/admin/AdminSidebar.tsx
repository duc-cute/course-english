import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
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
import {
  Avatar,
  Box,
  Drawer,
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

type AdminSidebarProps = {
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  onCloseMobileSidebar: () => void;
};

const ADMIN_MINI_DRAWER_WIDTH = 64;

const drawerPaperSx = (collapsed: boolean) => ({
  width: collapsed ? ADMIN_MINI_DRAWER_WIDTH : ADMIN_DRAWER_WIDTH,
  boxSizing: "border-box" as const,
  borderRight: "1px solid #e2e8f0",
  bgcolor: "#ffffff",
  boxShadow: "none",
  overflow: "hidden",
});

export function AdminSidebar({ mobileOpen, desktopCollapsed, onCloseMobileSidebar }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      {
        label: "Tổng quan",
        icon: <DashboardOutlinedIcon />,
        to: `/${paths.ADMIN}`,
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
        label: "Thư viện câu hỏi",
        icon: <QuizOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_QUESTIONS}`,
      },
      {
        label: "Đề thi / Kiểm tra",
        icon: <AssignmentOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_EXAM_PAPERS}`,
      },
      {
        label: "Thư viện từ",
        icon: <AbcOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_WORDS}`,
      },
      {
        label: "Bộ từ vựng",
        icon: <LibraryBooksOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`,
      },
      {
        label: "AI Reading Studio",
        icon: <AutoStoriesOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_STORIES}`,
      },
      {
        label: "Quản lý phân lớp",
        icon: <GroupAddOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_ENROLLMENT}`,
      },
      {
        label: "Cấu hình hệ thống",
        icon: <SettingsOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`,
      },
      {
        label: "Hướng dẫn sử dụng",
        icon: <HelpOutlineOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.USAGE_GUIDE}`,
      },
      {
        label: "Duyệt tài liệu",
        icon: <DescriptionOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.REVIEW_DOC}`,
      },
      {
        label: "AI Assistant",
        icon: <SmartToyOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.AI_ASSISTANT}`,
      },
      {
        label: "Nhật ký hệ thống",
        icon: <HistoryOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.ACTIVITY_LOGS}`,
      },
    ],
    [],
  );

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

  const renderDrawerContent = (collapsed: boolean) => (
    <Box className={`admin-sidebar-inner ${collapsed ? "collapsed" : ""}`}>
      <Stack direction="row" alignItems="center" spacing={1.5} className="admin-sidebar-brand">
        <Box className="admin-sidebar-brand-icon" aria-hidden>
          E
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="admin-sidebar-brand-title" noWrap>
            Course English
          </Typography>
          <Typography className="admin-sidebar-brand-sub" noWrap>
            Quản trị
          </Typography>
        </Box>
      </Stack>

      <Box className="admin-sidebar-nav">
        <List disablePadding className="admin-sidebar-nav-list">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== `/${paths.ADMIN}` && location.pathname.startsWith(item.to));
            const button = renderNavButton(item.label, item.icon, () => {
              navigate(item.to);
              if (mobileOpen) {
                onCloseMobileSidebar();
              }
            }, isActive);

            if (collapsed) {
              return (
                <Tooltip key={item.to} title={item.label} placement="right" arrow enterTouchDelay={0}>
                  {button}
                </Tooltip>
              );
            }

            return <Box key={item.to} component="div">{button}</Box>;
          })}
        </List>

        <List disablePadding className="admin-sidebar-nav-list admin-sidebar-nav-secondary">
          {(() => {
            const studentButton = renderNavButton("Khu vực học sinh", <EmojiPeopleOutlinedIcon />, () => {
              navigate(`/${paths.STUDENT}`);
              if (mobileOpen) {
                onCloseMobileSidebar();
              }
            });

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
        onClick={() => {
          navigate(`/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`);
          if (mobileOpen) {
            onCloseMobileSidebar();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(`/${paths.ADMIN}/${paths.MANAGE_SYSTEM_CONFIG}`);
            if (mobileOpen) {
              onCloseMobileSidebar();
            }
          }
        }}
      >
        <Avatar className="admin-sidebar-profile-avatar">A</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="admin-sidebar-profile-name" noWrap>
            Quản trị viên
          </Typography>
          <Typography className="admin-sidebar-profile-role" noWrap>
            Cell Architecture
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
        {renderDrawerContent(false)}
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
        {renderDrawerContent(desktopCollapsed)}
      </Drawer>
    </>
  );
}

export { ADMIN_DRAWER_WIDTH };
