import { Box, Typography } from "@mui/material";
import type { LessonAssetRecord, LessonBlockRecord } from "../../shared/api/lesson";
import { parseBlockPayload } from "../../shared/api/lesson";
import { parseExerciseSetPayload } from "../../student/lessonPlayer/exercise/parseExerciseSet";

type TextPayload = { html?: string };
type ImagePayload = { assetId?: string; caption?: string };

type LessonBlockPreviewProps = {
  block: LessonBlockRecord;
  assets: LessonAssetRecord[];
};

export function LessonBlockPreview({ block, assets }: LessonBlockPreviewProps) {
  if (block.blockType === "TEXT") {
    const payload = parseBlockPayload<TextPayload>(block.payloadJson);
    const html = payload.html?.trim();
    if (!html || html === "<p><br></p>") {
      return <Typography sx={{ fontSize: 13, color: "#888780", fontStyle: "italic" }}>Chưa có nội dung văn bản.</Typography>;
    }
    return (
      <Box
        sx={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "#333",
          "& p": { margin: "0 0 8px" },
          "& ul, & ol": { margin: "0 0 8px", pl: 2.5 },
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (block.blockType === "IMAGE") {
    const payload = parseBlockPayload<ImagePayload>(block.payloadJson);
    const asset = assets.find((a) => a.id === payload.assetId);
    if (!asset?.url) {
      return (
        <Typography sx={{ fontSize: 13, color: "#888780", fontStyle: "italic" }}>
          Chưa có ảnh — bấm Sửa để tải lên hoặc kéo thả.
        </Typography>
      );
    }
    return (
      <Box>
        <Box
          component="img"
          src={asset.url}
          alt={payload.caption || asset.caption || "Ảnh bài học"}
          sx={{ maxWidth: "100%", maxHeight: 200, borderRadius: "6px", border: "1px solid #ECEAE3" }}
        />
        {payload.caption ? (
          <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.75 }}>{payload.caption}</Typography>
        ) : null}
      </Box>
    );
  }

  if (block.blockType === "EXERCISE_SET") {
    const payload = parseExerciseSetPayload(block.payloadJson);
    const mcqCount = payload.questions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
    const firstMcq = payload.questions.find((q) => q.type === "MULTIPLE_CHOICE");
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.title || "Bài tập"}</strong>
          {payload.instruction ? ` — ${payload.instruction}` : ""}
          <br />
          <span style={{ color: "#5F5E5A" }}>
            {mcqCount} câu MCQ
            {payload.passScorePercent !== undefined ? ` · Đạt ${payload.passScorePercent}%` : ""}
          </span>
        </Typography>
        {firstMcq && firstMcq.type === "MULTIPLE_CHOICE" ? (
          <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5, fontStyle: "italic" }}>
            VD: {firstMcq.prompt.text || "(chưa có câu hỏi)"}
          </Typography>
        ) : null}
      </Box>
    );
  }

  return (
    <Typography sx={{ fontSize: 12, color: "#888780" }}>Preview chưa hỗ trợ loại block này.</Typography>
  );
}
