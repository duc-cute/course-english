import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import { Alert, Box, IconButton, Tooltip, Typography } from "@mui/material";
import type { ListenTypeQuestion, SpellingQuestion } from "../../../student/lessonPlayer/exercise/types";

type TypedExerciseQuestionCanvasProps = {
  question: SpellingQuestion | ListenTypeQuestion;
  index: number;
  canDelete: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
};

function playAudio(url: string) {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

export function TypedExerciseQuestionCanvas({
  question,
  index,
  canDelete,
  onDelete,
  onDuplicate,
}: TypedExerciseQuestionCanvasProps) {
  const isListenType = question.type === "LISTEN_TYPE";
  const label = isListenType ? "Nghe gõ (LISTEN_TYPE)" : "Gõ chính tả (SPELLING)";
  const promptText =
    question.type === "SPELLING"
      ? question.prompt.text
      : question.prompt?.text ?? "Nghe và gõ từ tiếng Anh";

  return (
    <Box sx={{ border: "1px solid #ECEAE3", borderTop: "none", borderRight: "none", bgcolor: "#fff", minHeight: "100%" }}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #ECEAE3", display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ px: 1, py: 0.25, borderRadius: "4px", bgcolor: "rgba(12, 68, 124, 0.1)", color: "#0C447C", fontSize: 11, fontWeight: 700 }}>
            Q{index + 1}
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
        </Box>
        <Box>
          <Tooltip title="Nhân đôi">
            <IconButton size="small" onClick={onDuplicate}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canDelete ? (
            <Tooltip title="Xóa câu">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
        <Alert severity="info" sx={{ fontSize: 12 }}>
          {isListenType ? (
            <>
              Câu nghe gõ — chỉ xem tại đây. Thêm mới bằng{" "}
              <strong>Thêm nghe gõ (từ thư viện)</strong> hoặc sinh từ Bộ từ vựng.
            </>
          ) : (
            <>
              Câu sinh từ <strong>bộ từ vựng</strong> — chỉ xem. Sinh lại từ Bộ từ vựng nếu cần sửa.
            </>
          )}
        </Alert>
        <Typography sx={{ fontSize: 14 }}>
          {isListenType ? "Nghe:" : "Nghĩa:"} <strong>{promptText}</strong>
        </Typography>
        {isListenType ? (
          <Box
            component="button"
            type="button"
            onClick={() => playAudio(question.audioUrl)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              alignSelf: "flex-start",
              px: 2,
              py: 1,
              border: "2px solid rgba(12, 68, 124, 0.25)",
              borderRadius: "999px",
              bgcolor: "rgba(12, 68, 124, 0.06)",
              cursor: "pointer",
            }}
          >
            <VolumeUpOutlinedIcon fontSize="small" />
            Nghe ({question.audioAccent ?? "UK"})
          </Box>
        ) : question.hint ? (
          <Typography sx={{ fontSize: 12, color: "#5F5E5A" }}>
            Gợi ý: <strong>{question.hint}</strong>
          </Typography>
        ) : null}
        <Typography sx={{ fontSize: 13 }}>
          Đáp án đúng: <strong>{question.correctAnswer}</strong>
          {question.wordEn ? ` (${question.wordEn})` : ""}
        </Typography>
      </Box>
    </Box>
  );
}
