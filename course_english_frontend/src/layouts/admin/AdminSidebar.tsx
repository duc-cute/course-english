import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import AbcOutlinedIcon from "@mui/icons-material/AbcOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
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
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
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
  boxShadow: "2px 0 8px -4px rgba(0, 0, 0, 0.05)",
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

  const renderDrawerContent = (collapsed: boolean) => (
    <Box className={`admin-sidebar-inner ${collapsed ? "collapsed" : ""}`}>
      <Stack direction="row" alignItems="center" spacing={1.5} className="admin-sidebar-brand">
        <Box className="admin-sidebar-brand-icon">
          <SchoolOutlinedIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="admin-sidebar-brand-title" variant="h6" noWrap>
            Course English
          </Typography>
          <Typography className="admin-sidebar-brand-sub" noWrap>
            Quản trị
          </Typography>
        </Box>
      </Stack>

      <Box className="admin-sidebar-nav">
        <List disablePadding>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== `/${paths.ADMIN}` && location.pathname.startsWith(item.to));
            return (
              <ListItemButton
                key={item.to}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  navigate(item.to);
                  if (mobileOpen) {
                    onCloseMobileSidebar();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "var(--ac-outline-variant)", my: 1 }} />

        <List disablePadding>
          <ListItemButton
            className="admin-nav-item"
            onClick={() => {
              navigate(`/${paths.STUDENT}`);
              if (mobileOpen) {
                onCloseMobileSidebar();
              }
            }}
          >
            <ListItemIcon>
              <EmojiPeopleOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Khu vực học sinh" />
          </ListItemButton>
        </List>
      </Box>

      <Box className="admin-sidebar-profile">
        <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", fontSize: 14, flexShrink: 0 }}>
          A
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="admin-sidebar-profile-name" noWrap>
            Quản trị viên
          </Typography>
          <Typography className="admin-sidebar-profile-role" noWrap>
            Cell Architecture
          </Typography>
        </Box>
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
