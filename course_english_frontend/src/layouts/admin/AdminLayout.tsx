import { Box } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import "../../styles/admin-layout.css";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box className="admin-layout-root">
      <AdminSidebar mobileOpen={mobileOpen} onToggleSidebar={toggleDrawer} />
      <Box className="admin-layout-frame">
        <AdminHeader onToggleSidebar={toggleDrawer} />
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
