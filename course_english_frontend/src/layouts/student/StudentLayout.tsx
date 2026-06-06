import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { STUDENT_SCROLL_ROOT_ID } from "../../shared/constants/scrollRoots";
import { StudentHeader } from "./StudentHeader";
import { StudentSidebar } from "./StudentSidebar";
import "../../styles/student-layout.css";
import "../../styles/student-lessons.css";

export function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <Box className="student-layout-root">
      <StudentSidebar mobileOpen={mobileOpen} onToggleSidebar={() => setMobileOpen((v) => !v)} />
      <Box className="student-layout-frame">
        <StudentHeader onToggleSidebar={() => setMobileOpen((v) => !v)} />
        <Box
          component="main"
          id={STUDENT_SCROLL_ROOT_ID}
          className="student-layout-main"
          sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
