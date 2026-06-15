import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { Alert } from "@mui/material";
import { LessonBlockReader } from "../components/LessonBlockReader";
import { LessonReaderUpNext } from "../components/LessonReaderUpNext";
import {
  estimateReadingMinutes,
  getBlockCssModifier,
  getBlockTocTitle,
  getBlockTypeLabel,
  getLessonBlockDomId,
} from "../lessonReaderUtils";
import type { LessonAssetRecord, LessonBlockRecord, LessonRecord } from "../../shared/api/lesson";

type StudyPanelProps = {
  studyBlocks: LessonBlockRecord[];
  assets: LessonAssetRecord[];
  activeBlockId: string | null;
  nextLesson: LessonRecord | null;
};

export function StudyPanel({ studyBlocks, assets, activeBlockId, nextLesson }: StudyPanelProps) {
  const readingMin = estimateReadingMinutes(studyBlocks);

  if (studyBlocks.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: "14px" }}>
        Bài học này chưa có phần nội dung (tab Bài học). Chuyển sang tab <strong>Bài tập</strong> nếu có.
      </Alert>
    );
  }

  return (
    <>
      <div className="lesson-reader-meta" role="status">
        <span>
          <ViewListOutlinedIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }} />
          <strong>{studyBlocks.length}</strong> phần nội dung
        </span>
        <span>
          <ScheduleOutlinedIcon sx={{ fontSize: 16, verticalAlign: "text-bottom", mr: 0.5 }} />
          Khoảng <strong>{readingMin}</strong> phút đọc
        </span>
      </div>

      <div className="lesson-reader-blocks">
        {studyBlocks.map((block, index) => (
          <section
            key={block.id}
            id={getLessonBlockDomId(block.id)}
            className={`lesson-reader-block ${getBlockCssModifier(block.blockType)} ${
              block.id === activeBlockId ? "is-active-section" : ""
            }`.trim()}
            aria-labelledby={block.blockType === "SLIDE_DECK" ? undefined : `block-label-${block.id}`}
          >
            {block.blockType !== "SLIDE_DECK" ? (
            <div className="lesson-reader-block-head">
              <span className="lesson-reader-block-index" aria-hidden>
                {index + 1}
              </span>
              <div>
                <span id={`block-label-${block.id}`} className="lesson-reader-block-label">
                  {getBlockTocTitle(block, index)}
                </span>
                <span className="lesson-reader-block-type">{getBlockTypeLabel(block.blockType)}</span>
              </div>
            </div>
            ) : null}
            <LessonBlockReader block={block} assets={assets} variant="reader" />
          </section>
        ))}
      </div>

      {nextLesson ? <LessonReaderUpNext nextLesson={nextLesson} /> : null}
    </>
  );
}
