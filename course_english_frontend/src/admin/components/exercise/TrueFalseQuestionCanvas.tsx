import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { TrueFalseQuestion } from "../../../student/lessonPlayer/exercise/types";

type TrueFalseQuestionCanvasProps = {
  question: TrueFalseQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: TrueFalseQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function TrueFalseQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: TrueFalseQuestionCanvasProps) {
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
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0b1c30" }}>
            Đúng / Sai
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Tooltip title="Nhân bản">
            <IconButton size="small" onClick={onDuplicate} aria-label="Nhân bản">
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {canDelete ? (
            <Tooltip title="Xóa câu">
              <IconButton size="small" onClick={onDelete} aria-label="Xóa câu">
                <DeleteOutlineIcon sx={{ fontSize: 18, color: "#BA1A1A" }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, display: "grid", gap: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
            Nội dung câu hỏi
          </Typography>
          <TextField
            multiline
            minRows={2}
            fullWidth
            placeholder="Nhập câu khẳng định (tiếng Anh)..."
            value={question.prompt.text}
            onChange={(e) =>
              onChange({
                ...question,
                prompt: { ...question.prompt, text: e.target.value },
              })
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 15,
                "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#0C447C" },
              },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 1 }}>
            Đáp án đúng
          </Typography>
          <RadioGroup
            row
            value={question.correctAnswer ? "true" : "false"}
            onChange={(e) =>
              onChange({
                ...question,
                correctAnswer: e.target.value === "true",
              })
            }
          >
            <FormControlLabel value="true" control={<Radio size="small" />} label="Đúng" />
            <FormControlLabel value="false" control={<Radio size="small" />} label="Sai" />
          </RadioGroup>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
            Giải thích (tuỳ chọn)
          </Typography>
          <TextField
            multiline
            minRows={2}
            fullWidth
            placeholder="Giải thích ngắn..."
            value={question.explanation ?? ""}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 14,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
