import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useMemo } from "react";
import type { LessonBlockRecord } from "../../shared/api/lesson";
import { getActiveBlockMascotTip } from "../lessonReaderUtils";
import { MascotAvatar } from "../ui/MascotAvatar";

type PlayerMascotTipProps = {
  blocks: LessonBlockRecord[];
  activeBlockId: string | null;
  visible: boolean;
};

export function PlayerMascotTip({ blocks, activeBlockId, visible }: PlayerMascotTipProps) {
  const tip = useMemo(() => getActiveBlockMascotTip(blocks, activeBlockId), [blocks, activeBlockId]);

  if (!visible || blocks.length === 0) return null;

  return (
    <aside className="vq-player-mascot-tip" aria-live="polite">
      <div className="vq-player-mascot-tip__avatar">
        <MascotAvatar />
      </div>
      <div className="vq-player-mascot-tip__bubble">
        <p className="vq-player-mascot-tip__label">
          <LightbulbOutlinedIcon sx={{ fontSize: 16 }} />
          {tip.label}
        </p>
        <p className="vq-player-mascot-tip__text">{tip.text}</p>
      </div>
    </aside>
  );
}
