import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import type { LessonBlockRecord } from "../../../shared/api/lesson";
import {
  isCalloutHtmlEmpty,
  parseCalloutBlockPayload,
  type CalloutVariant,
} from "../../../shared/lesson/calloutPayload";

type CalloutBlockProps = {
  block: LessonBlockRecord;
};

const VARIANT_LABELS: Record<CalloutVariant, string> = {
  tip: "Mẹo học",
  warning: "Chú ý",
  definition: "Định nghĩa",
};

function CalloutIcon({ variant }: { variant: CalloutVariant }) {
  if (variant === "warning") {
    return <WarningAmberOutlinedIcon className="callout-block-icon" aria-hidden />;
  }
  if (variant === "definition") {
    return <InfoOutlinedIcon className="callout-block-icon" aria-hidden />;
  }
  return <LightbulbOutlinedIcon className="callout-block-icon" aria-hidden />;
}

export function CalloutBlock({ block }: CalloutBlockProps) {
  const payload = parseCalloutBlockPayload(block.payloadJson);
  if (isCalloutHtmlEmpty(payload.html)) {
    return <p className="lesson-reader-empty-note">Ghi chú trống.</p>;
  }

  return (
    <aside className={`callout-block callout-block--${payload.variant}`}>
      <div className="callout-block-head">
        <CalloutIcon variant={payload.variant} />
        <div>
          <span className="callout-block-eyebrow">{VARIANT_LABELS[payload.variant]}</span>
          {payload.title?.trim() ? (
            <h3 className="callout-block-title">{payload.title.trim()}</h3>
          ) : null}
        </div>
      </div>
      <div
        className="callout-block-body lesson-reader-text"
        dangerouslySetInnerHTML={{ __html: payload.html }}
      />
    </aside>
  );
}
