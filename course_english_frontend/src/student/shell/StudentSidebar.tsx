import MenuIcon from "@mui/icons-material/Menu";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paths, studentRoutePaths } from "../../shared/constants/paths";
import { ADMIN_DRAWER_WIDTH } from "../../theme/academicCore";
import { initialsFromDisplayName } from "../shared/auth/studentInitials";
import { useStudentAccountProfile } from "../shared/auth/useStudentAccountProfile";
import {
  STUDENT_APP_TITLE,
  isStudentNavActive,
  studentNavItems,
} from "./studentNavItems";
import { BrandLogo } from "../../shared/ui/BrandLogo";

type StudentSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const STUDENT_SIDEBAR_BREAKPOINT = 768;

const drawerPaperSx = {
  width: ADMIN_DRAWER_WIDTH,
  boxSizing: "border-box" as const,
  borderRight: "1px solid #e2e8f0",
  bgcolor: "#ffffff",
  boxShadow: "none",
  overflow: "hidden",
};

export function StudentSidebar({ mobileOpen, onClose }: StudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { displayName, email, avatarUrl } = useStudentAccountProfile();
  const initials = initialsFromDisplayName(displayName);
  const navItems = studentNavItems.filter((item) => item.showInSidebar);

  const closeAfterNavigate = () => {
    if (mobileOpen) {
      onClose();
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

  const renderDrawerContent = () => (
    <Box className="admin-sidebar-inner">
      <Stack direction="row" alignItems="center" spacing={1.5} className="admin-sidebar-brand">
        <BrandLogo size="sm" />
        <Box sx={{ minWidth: 0 }}>
          <Typography className="admin-sidebar-brand-title" noWrap>
            {STUDENT_APP_TITLE}
          </Typography>
          <Typography className="admin-sidebar-brand-sub" noWrap>
            Khu vực học sinh
          </Typography>
        </Box>
      </Stack>

      <Box className="admin-sidebar-nav">
        <List disablePadding className="admin-sidebar-nav-list">
          {navItems.map((item) => {
            const isActive = isStudentNavActive(location.pathname, item.to);
            const Icon = item.icon;
            return (
              <Box key={item.id} component="div">
                {renderNavButton(item.label, <Icon />, () => {
                  navigate(item.to);
                  closeAfterNavigate();
                }, isActive)}
              </Box>
            );
          })}
        </List>

        <List disablePadding className="admin-sidebar-nav-list admin-sidebar-nav-secondary">
          {renderNavButton("Khu vực quản trị", <SpaceDashboardOutlinedIcon />, () => {
            navigate(`/${paths.ADMIN}`);
            closeAfterNavigate();
          })}
        </List>
      </Box>

      <Box
        className="admin-sidebar-profile"
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate(studentRoutePaths.profile);
          closeAfterNavigate();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(studentRoutePaths.profile);
            closeAfterNavigate();
          }
        }}
      >
        <Avatar
          className="admin-sidebar-profile-avatar"
          src={avatarUrl ?? undefined}
          alt={displayName}
        >
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="admin-sidebar-profile-name" noWrap>
            {displayName || "Học sinh"}
          </Typography>
          <Typography className="admin-sidebar-profile-role" noWrap>
            {email || "Tài khoản học sinh"}
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
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: "block",
          [`@media (min-width: ${STUDENT_SIDEBAR_BREAKPOINT}px)`]: {
            display: "none",
          },
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            height: "100%",
          },
        }}
      >
        {renderDrawerContent()}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        className="student-app-sidebar-drawer"
        sx={{
          display: "none",
          [`@media (min-width: ${STUDENT_SIDEBAR_BREAKPOINT}px)`]: {
            display: "block",
          },
          width: ADMIN_DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            position: "relative",
            height: "100vh",
          },
        }}
      >
        {renderDrawerContent()}
      </Drawer>
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
