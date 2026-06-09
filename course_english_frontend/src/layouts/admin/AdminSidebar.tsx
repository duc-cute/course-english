import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
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
  onToggleSidebar: () => void;
};

const drawerPaperSx = {
  width: ADMIN_DRAWER_WIDTH,
  boxSizing: "border-box" as const,
  borderRight: "1px solid var(--ac-outline-variant, #c3c6d7)",
  bgcolor: "var(--ac-surface, #f8f9ff)",
  overflow: "hidden",
};

export function AdminSidebar({ mobileOpen, onToggleSidebar }: AdminSidebarProps) {
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
        label: "Hướng dẫn sử dụng",
        icon: <HelpOutlineOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.USAGE_GUIDE}`,
      },
      {
        label: "Duyệt tài liệu",
        icon: <DescriptionOutlinedIcon />,
        to: `/${paths.ADMIN}/${paths.REVIEW_DOC}`,
      },
    ],
    [],
  );

  const drawerContent = (
    <Box className="admin-sidebar-inner">
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
                  onToggleSidebar();
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
              onToggleSidebar();
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
        onClose={onToggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            height: "100%",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        className="admin-sidebar-drawer"
        sx={{
          display: { xs: "none", md: "block" },
          width: ADMIN_DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            position: "relative",
            height: "100vh",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export { ADMIN_DRAWER_WIDTH };
