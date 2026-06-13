import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { STUDENT_SCROLL_ROOT_ID } from "../../shared/constants/scrollRoots";
import { StudentBottomNav } from "./StudentBottomNav";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopBar } from "./StudentTopBar";

export function StudentAppShell() {
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
    <div className="student-zone-root student-app-shell">
      <StudentSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="student-app-shell__frame">
        <StudentTopBar onOpenMenu={() => setMobileOpen(true)} />
        <main id={STUDENT_SCROLL_ROOT_ID} className="student-app-shell__main student-layout-main">
          <Outlet />
        </main>
      </div>
      <StudentBottomNav />
    </div>
  );
}
