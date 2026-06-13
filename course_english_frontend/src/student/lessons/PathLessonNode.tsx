import CheckIcon from "@mui/icons-material/Check";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { useNavigate } from "react-router-dom";
import { studentLessonPath } from "../../shared/lesson/lessonPaths";
import type { PathLessonNode as PathLessonNodeModel } from "./lessonListUtils";

type PathLessonNodeProps = {
  node: PathLessonNodeModel;
  showMascotTip?: boolean;
};

export function PathLessonNode({ node, showMascotTip }: PathLessonNodeProps) {
  const navigate = useNavigate();
  const { lesson, state } = node;
  const isLocked = state === "locked";

  const handleClick = () => {
    if (isLocked) return;
    navigate(studentLessonPath(lesson));
  };

  return (
    <div
      className="vq-path-node-wrap"
      style={{ transform: `translateX(${node.offsetPx}px)` }}
    >
      {showMascotTip && state === "active" ? (
        <div className="vq-path-node-tip">
          <p>Tiếp tục bài này nhé!</p>
        </div>
      ) : null}

      <button
        type="button"
        className={`vq-path-node vq-path-node--${state}`}
        onClick={handleClick}
        disabled={isLocked}
        aria-label={lesson.title}
        title={lesson.title}
      >
        {state === "completed" ? (
          <CheckIcon sx={{ fontSize: 30 }} />
        ) : state === "locked" ? (
          <LockOutlinedIcon sx={{ fontSize: 30 }} />
        ) : (
          <MenuBookOutlinedIcon sx={{ fontSize: 36 }} />
        )}
      </button>

      <span className={`vq-path-node__label${state === "active" ? " vq-path-node__label--active" : ""}`}>
        {state === "active" ? `Đang học: ${lesson.title}` : lesson.title}
      </span>
    </div>
  );
}
