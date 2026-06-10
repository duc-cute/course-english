import { Box, Typography } from "@mui/material";
import type { LessonAssetRecord, LessonBlockRecord } from "../../shared/api/lesson";
import { parseBlockPayload } from "../../shared/api/lesson";
import { parseExerciseSetPayload } from "../../student/lessonPlayer/exercise/parseExerciseSet";
import { parseQuestionRefPayload, parseResolvedQuestions } from "../../student/lessonPlayer/exercise/parseQuestionRef";
import { isCalloutHtmlEmpty, parseCalloutBlockPayload } from "../../shared/lesson/calloutPayload";
import { parseSummaryBlockPayload } from "../../shared/lesson/summaryPayload";
import {
  parseResolvedVocabularyItems,
  parseVocabularyBlockPayload,
} from "../../shared/lesson/vocabularyPayload";

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
    const listenCount = payload.questions.filter((q) => q.type === "LISTEN_CHOOSE").length;
    const spellingCount = payload.questions.filter((q) => q.type === "SPELLING").length;
    const listenTypeCount = payload.questions.filter((q) => q.type === "LISTEN_TYPE").length;
    const matchingCount = payload.questions.filter((q) => q.type === "MATCHING").length;
    const firstMcq = payload.questions.find((q) => q.type === "MULTIPLE_CHOICE");
    const firstListen = payload.questions.find((q) => q.type === "LISTEN_CHOOSE");
    const firstSpelling = payload.questions.find((q) => q.type === "SPELLING");
    const firstListenType = payload.questions.find((q) => q.type === "LISTEN_TYPE");
    const questionParts = [
      mcqCount ? `${mcqCount} MCQ` : "",
      listenCount ? `${listenCount} nghe chọn` : "",
      spellingCount ? `${spellingCount} gõ chính tả` : "",
      listenTypeCount ? `${listenTypeCount} nghe gõ` : "",
      matchingCount ? `${matchingCount} ghép cặp` : "",
    ].filter(Boolean);
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.title || "Bài tập"}</strong>
          {payload.instruction ? ` — ${payload.instruction}` : ""}
          <br />
          <span style={{ color: "#5F5E5A" }}>
            {questionParts.join(" · ") || "0 câu"}
            {payload.passScorePercent !== undefined ? ` · Đạt ${payload.passScorePercent}%` : ""}
          </span>
        </Typography>
        {firstListen && firstListen.type === "LISTEN_CHOOSE" ? (
          <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5, fontStyle: "italic" }}>
            VD nghe: {firstListen.wordEn?.trim() || "—"} → chọn nghĩa
          </Typography>
        ) : firstSpelling && firstSpelling.type === "SPELLING" ? (
          <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5, fontStyle: "italic" }}>
            VD gõ: {firstSpelling.prompt.text} → {firstSpelling.correctAnswer}
          </Typography>
        ) : firstListenType && firstListenType.type === "LISTEN_TYPE" ? (
          <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5, fontStyle: "italic" }}>
            VD nghe gõ: {firstListenType.wordEn?.trim() || firstListenType.correctAnswer}
          </Typography>
        ) : firstMcq && firstMcq.type === "MULTIPLE_CHOICE" ? (
          <Typography sx={{ fontSize: 12, color: "#888780", mt: 0.5, fontStyle: "italic" }}>
            VD: {firstMcq.prompt.text || "(chưa có câu hỏi)"}
          </Typography>
        ) : null}
      </Box>
    );
  }

  if (block.blockType === "VOCABULARY") {
    const payload = parseVocabularyBlockPayload(block.payloadJson);
    const items = parseResolvedVocabularyItems(block.resolvedVocabularyJson);
    const previewWords = items
      .slice(0, 3)
      .map((i) => i.wordEn)
      .join(", ");
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.title || payload.vocabularySetTitle || "Từ vựng"}</strong>
          {payload.instruction ? ` — ${payload.instruction}` : ""}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.25 }}>
          {payload.presentation === "flashcard" ? "Flashcard · " : "Danh sách · "}
          {items.length > 0 ? `${items.length} từ` : "Chưa resolve (publish bộ từ?)"}
          {previewWords ? ` · ${previewWords}${items.length > 3 ? "…" : ""}` : ""}
        </Typography>
      </Box>
    );
  }

  if (block.blockType === "SUMMARY") {
    const payload = parseSummaryBlockPayload(block.payloadJson);
    const previewItems = payload.items.slice(0, 3);
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.title || "Tóm tắt"}</strong>
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.25 }}>
          {payload.items.length} ý
          {previewItems.length ? ` · ${previewItems.join(" · ")}${payload.items.length > 3 ? "…" : ""}` : ""}
        </Typography>
      </Box>
    );
  }

  if (block.blockType === "CALLOUT") {
    const payload = parseCalloutBlockPayload(block.payloadJson);
    const plain = (payload.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.variant === "warning" ? "Chú ý" : payload.variant === "definition" ? "Định nghĩa" : "Mẹo"}</strong>
          {payload.title ? ` — ${payload.title}` : ""}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.25, fontStyle: "italic" }}>
          {isCalloutHtmlEmpty(payload.html)
            ? "Chưa có nội dung."
            : plain.length > 120
              ? `${plain.slice(0, 120)}…`
              : plain}
        </Typography>
      </Box>
    );
  }

  if (block.blockType === "QUESTION_REF") {
    const payload = parseQuestionRefPayload(block.payloadJson);
    const resolved = parseResolvedQuestions(block.resolvedQuestionsJson);
    return (
      <Box>
        <Typography sx={{ fontSize: 13, color: "#333" }}>
          <strong>{payload.title || "Bài tập (ngân hàng)"}</strong>
          {payload.instruction ? ` — ${payload.instruction}` : ""}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#5F5E5A", mt: 0.25 }}>
          {payload.refs.length} câu tham chiếu
          {resolved.length > 0 ? ` · ${resolved.length} câu resolve` : ""}
        </Typography>
      </Box>
    );
  }

  return (
    <Typography sx={{ fontSize: 12, color: "#888780" }}>Preview chưa hỗ trợ loại block này.</Typography>
  );
}
