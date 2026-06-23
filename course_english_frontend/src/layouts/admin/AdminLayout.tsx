import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  AiAssistantDrawerProvider,
  useAiAssistantDrawer,
} from "../../shared/ai/AiAssistantDrawerContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import "../../styles/admin-layout.css";
import "../../styles/student/notifications.css";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <AiAssistantDrawerProvider onBeforeOpenDrawer={() => setMobileOpen(false)}>
      <AdminLayoutShell mobileOpen={mobileOpen} onToggleSidebar={toggleDrawer} onOpenAdminMenu={() => setMobileOpen(true)} />
    </AiAssistantDrawerProvider>
  );
}

type AdminLayoutShellProps = {
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onOpenAdminMenu: () => void;
};

function AdminLayoutShell({ mobileOpen, onToggleSidebar, onOpenAdminMenu }: AdminLayoutShellProps) {
  const { registerOpenAdminMenu, unregisterOpenAdminMenu } = useAiAssistantDrawer();

  useEffect(() => {
    registerOpenAdminMenu(onOpenAdminMenu);
    return unregisterOpenAdminMenu;
  }, [onOpenAdminMenu, registerOpenAdminMenu, unregisterOpenAdminMenu]);

  return (
    <Box className="admin-layout-root">
      <AdminSidebar mobileOpen={mobileOpen} onToggleSidebar={onToggleSidebar} />
      <Box className="admin-layout-frame">
        <AdminHeader onToggleSidebar={onToggleSidebar} />
        <Box
          component="main"
          className="admin-layout-main"
          sx={{
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
            bgcolor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export { ADMIN_DRAWER_WIDTH } from "../../theme/academicCore";
