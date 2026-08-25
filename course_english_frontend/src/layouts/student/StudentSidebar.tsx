import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { BrandLogo } from "../../shared/ui/BrandLogo";
import {
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
import { paths } from "../../shared/constants/paths";

const DRAWER_WIDTH = 240;

const drawerPaperSx = {
  width: DRAWER_WIDTH,
  boxSizing: "border-box" as const,
};

type StudentSidebarProps = {
  mobileOpen: boolean;
  onToggleSidebar: () => void;
};

export function StudentSidebar({ mobileOpen, onToggleSidebar }: StudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      {
        label: "Trang chủ",
        icon: <DashboardCustomizeOutlinedIcon />,
        to: `/${paths.STUDENT}`,
      },
      {
        label: "Bài học",
        icon: <ArticleOutlinedIcon />,
        to: `/${paths.STUDENT}/${paths.STUDENT_LESSONS}`,
      },
      {
        label: "Đề thi",
        icon: <AssignmentOutlinedIcon />,
        to: `/${paths.STUDENT}/${paths.STUDENT_EXAMS}`,
      },
      {
        label: "Hướng dẫn sử dụng",
        icon: <HelpOutlineOutlinedIcon />,
        to: `/${paths.STUDENT}/${paths.USAGE_GUIDE}`,
      },
    ],
    [],
  );

  const drawerContent = (
    <Box className="student-sidebar-inner" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box className="student-sidebar-brand" sx={{ px: 2, py: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BrandLogo size="sm" />
          <Typography fontWeight={700} fontSize={15} sx={{ color: "var(--eng-on-surface)" }}>
            Nova English
          </Typography>
        </Stack>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <ListItemButton
              key={item.to}
              className={`student-nav-item${active ? " active" : ""}`}
              onClick={() => {
                navigate(item.to);
                onToggleSidebar();
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
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
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        className="student-sidebar-drawer"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            position: "relative",
            height: "100vh",
            borderRight: "1px solid var(--eng-outline-variant)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
