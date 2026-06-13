import CloseIcon from "@mui/icons-material/Close";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import { Outlet, useNavigate } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { STUDENT_SCROLL_ROOT_ID } from "../../shared/constants/scrollRoots";
import { useLessonPlayerChrome } from "../lessonPlayer/LessonPlayerChromeContext";
import { VqBadge, VqProgressBar } from "../ui";

export function StudentPlayerShell() {
  const navigate = useNavigate();
  const { chrome } = useLessonPlayerChrome();

  return (
    <div className="student-zone-root student-player-shell">
      <header className="student-player-shell__header">
        <button
          type="button"
          className="student-player-shell__close"
          aria-label="Thoát bài học"
          onClick={() => navigate(studentRoutePaths.lessons)}
        >
          <CloseIcon />
        </button>
        <div className="student-player-shell__progress">
          {chrome.lessonTitle ? (
            <p className="student-player-shell__title" title={chrome.lessonTitle}>
              {chrome.lessonTitle}
            </p>
          ) : null}
          <VqProgressBar
            value={chrome.progressPercent}
            showThumb
            label={chrome.progressHint || undefined}
            hint={chrome.progressPercent > 0 ? `${Math.round(chrome.progressPercent)}%` : undefined}
          />
        </div>
        <VqBadge tone="streak" icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: 16 }} />}>
          —
        </VqBadge>
      </header>
      <div id={STUDENT_SCROLL_ROOT_ID} className="student-player-shell__body student-layout-main">
        <Outlet />
      </div>
    </div>
  );
}
