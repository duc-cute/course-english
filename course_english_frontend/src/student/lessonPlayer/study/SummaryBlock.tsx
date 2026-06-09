import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import { parseSummaryBlockPayload } from "../../../shared/lesson/summaryPayload";

type SummaryBlockProps = {
  block: LessonBlockRecord;
};

export function SummaryBlock({ block }: SummaryBlockProps) {
  const payload = parseSummaryBlockPayload(block.payloadJson);
  if (!payload.items.length) {
    return <p className="lesson-reader-empty-note">Chưa có ý tóm tắt.</p>;
  }

  return (
    <div className="summary-block">
      <div className="summary-block-head">
        <CheckCircleOutlineIcon className="summary-block-icon" aria-hidden />
        <h3 className="summary-block-title">{payload.title?.trim() || "Điểm chính cần nhớ"}</h3>
      </div>
      <ul className="summary-block-list">
        {payload.items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
