import CenterFocusStrongOutlinedIcon from "@mui/icons-material/CenterFocusStrongOutlined";
import { VqButton } from "../ui";

type LessonReaderToolbarProps = {
  focusMode: boolean;
  onToggleFocus: () => void;
  visible: boolean;
};

export function LessonReaderToolbar({ focusMode, onToggleFocus, visible }: LessonReaderToolbarProps) {
  if (!visible) return null;

  return (
    <div className="vq-player-toolbar">
      <VqButton variant={focusMode ? "primary" : "ghost"} size="sm" onClick={onToggleFocus}>
        <CenterFocusStrongOutlinedIcon sx={{ fontSize: 18 }} />
        {focusMode ? "Thoát focus" : "Tập trung"}
      </VqButton>
    </div>
  );
}
