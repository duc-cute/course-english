import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ListenChooseQuestion } from "../../../student/lessonPlayer/exercise/types";

type ListenChooseQuestionCanvasProps = {
  question: ListenChooseQuestion;
  index: number;
  canDelete: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
};

function playAudio(url: string) {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

export function ListenChooseQuestionCanvas({
  question,
  index,
  canDelete,
  onDelete,
  onDuplicate,
}: ListenChooseQuestionCanvasProps) {
  const accentLabel = question.audioAccent === "US" ? "US" : "UK";
  const correctText =
    question.choices.find((c) => c.id === question.correctChoiceId)?.text ?? "—";

  return (
    <Box
      sx={{
        border: "1px solid #ECEAE3",
        borderTop: "none",
        borderRight: "none",
        borderRadius: 0,
        bgcolor: "#fff",
        overflow: "hidden",
        minHeight: "100%",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: "1px solid #ECEAE3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              bgcolor: "rgba(12, 68, 124, 0.1)",
              color: "#0C447C",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Q{index + 1}
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
            Nghe chọn (LISTEN)
          </Typography>
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

      <Box sx={{ p: 2, display: "grid", gap: 2 }}>
        <Alert severity="info" sx={{ fontSize: 12 }}>
          Câu nghe sinh từ <strong>bộ từ vựng</strong> — chỉ xem tại đây. Để sửa, sinh lại từ{" "}
          <strong>Bộ từ vựng → Sinh bài nghe</strong>.
        </Alert>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <HeadphonesOutlinedIcon sx={{ color: "#0C447C" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {question.wordEn?.trim() || "—"}
          </Typography>
          <Chip size="small" label={`Audio ${accentLabel}`} variant="outlined" />
        </Box>

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
            color: "#0C447C",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(12, 68, 124, 0.1)" },
          }}
        >
          <VolumeUpOutlinedIcon fontSize="small" />
          Nghe thử ({accentLabel})
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", mb: 1 }}>
            Đáp án (học sinh chọn nghĩa tiếng Việt)
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {question.choices.map((choice, choiceIndex) => {
              const isCorrect = choice.id === question.correctChoiceId;
              return (
                <Box
                  key={choice.id}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: "8px",
                    border: isCorrect ? "2px solid #22a06b" : "1px solid #ECEAE3",
                    bgcolor: isCorrect ? "#d8f5e4" : "#F8F7F4",
                    fontSize: 13,
                  }}
                >
                  <strong>{choiceIndex + 1}.</strong> {choice.text}
                  {isCorrect ? (
                    <Typography component="span" sx={{ ml: 1, fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                      (đúng)
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Box>
          <Typography sx={{ fontSize: 11, color: "#888780", mt: 1 }}>
            Đáp án đúng: <strong>{correctText}</strong>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
