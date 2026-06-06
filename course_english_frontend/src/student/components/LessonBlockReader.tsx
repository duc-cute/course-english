import { Box, Typography } from "@mui/material";
import type { LessonAssetRecord, LessonBlockRecord } from "../../shared/api/lesson";
import { parseBlockPayload } from "../../shared/api/lesson";

type TextPayload = { html?: string };
type ImagePayload = { assetId?: string; caption?: string };

type LessonBlockReaderProps = {
  block: LessonBlockRecord;
  assets: LessonAssetRecord[];
  variant?: "reader" | "preview";
};

export function LessonBlockReader({ block, assets, variant = "preview" }: LessonBlockReaderProps) {
  const isReader = variant === "reader";

  if (block.blockType === "TEXT") {
    const payload = parseBlockPayload<TextPayload>(block.payloadJson);
    const html = payload.html?.trim();
    if (!html || html === "<p><br></p>") {
      if (isReader) {
        return (
          <Typography sx={{ fontSize: 14, color: "#888780", fontStyle: "italic" }}>
            (Phần văn bản trống)
          </Typography>
        );
      }
      return null;
    }
    return <Box className="lesson-reader-text" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  if (block.blockType === "IMAGE") {
    const payload = parseBlockPayload<ImagePayload>(block.payloadJson);
    const asset = assets.find((a) => a.id === payload.assetId);
    if (!asset?.url) return null;
    const caption = payload.caption || asset.caption;

    if (isReader) {
      return (
        <figure className="lesson-reader-figure">
          <div className="lesson-reader-figure-inner">
            <img src={asset.url} alt={caption || "Ảnh minh họa"} loading="lazy" />
            {caption ? <div className="lesson-reader-figure-caption-overlay">{caption}</div> : null}
          </div>
        </figure>
      );
    }

    return (
      <Box>
        <Box
          component="img"
          src={asset.url}
          alt={caption || "Ảnh minh họa"}
          sx={{
            width: "100%",
            maxHeight: 480,
            objectFit: "contain",
            borderRadius: "8px",
            border: "1px solid #ECEAE3",
            bgcolor: "#fafaf8",
          }}
        />
        {caption ? (
          <Typography sx={{ fontSize: 13, color: "#5F5E5A", mt: 1, textAlign: "center" }}>{caption}</Typography>
        ) : null}
      </Box>
    );
  }

  if (block.blockType === "VIDEO" || block.blockType === "AUDIO") {
    return (
      <Typography sx={{ fontSize: 14, color: "#888780", fontStyle: "italic" }}>
        {block.blockType === "AUDIO" ? "Audio" : "Video"} — hỗ trợ đầy đủ ở Phase P1.
      </Typography>
    );
  }

  if (block.blockType === "QUESTION_REF") {
    return (
      <Typography sx={{ fontSize: 14, color: "#888780", fontStyle: "italic" }}>
        Câu hỏi / quiz — sẽ hỗ trợ ở Phase P2.
      </Typography>
    );
  }

  return null;
}
