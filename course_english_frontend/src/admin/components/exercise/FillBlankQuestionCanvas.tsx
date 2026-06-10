import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import {
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import {
  formatAcceptedAnswers,
  parseAcceptedAnswersInput,
  syncBlanksWithPrompt,
} from "../../../shared/lesson/fillBlankUtils";
import type { FillBlankQuestion } from "../../../student/lessonPlayer/exercise/types";

type FillBlankQuestionCanvasProps = {
  question: FillBlankQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: FillBlankQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function FillBlankQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: FillBlankQuestionCanvasProps) {
  const updatePrompt = (text: string) => {
    const blanks = syncBlanksWithPrompt(text, question.blanks);
    onChange({
      ...question,
      prompt: { ...question.prompt, text },
      blanks,
    });
  };

  const updateBlankAnswers = (blankId: string, input: string) => {
    onChange({
      ...question,
      blanks: question.blanks.map((blank) =>
        blank.id === blankId
          ? { ...blank, acceptedAnswers: parseAcceptedAnswersInput(input) }
          : blank,
      ),
    });
  };

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
          <ShortTextOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0C447C" }}>
            Điền khuyết (FILL_BLANK)
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
        <TextField
          label='Câu (dùng "___" cho chỗ trống)'
          value={question.prompt.text}
          onChange={(e) => updatePrompt(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
          placeholder="I ___ to school every day."
          sx={muTextFieldSx}
          helperText="Có thể dùng nhiều ___ — mỗi ô một đáp án bên dưới"
        />

        {question.blanks.map((blank, blankIndex) => (
          <TextField
            key={blank.id}
            label={`Đáp án ô ${blankIndex + 1} (${blank.id})`}
            value={formatAcceptedAnswers(blank.acceptedAnswers)}
            onChange={(e) => updateBlankAnswers(blank.id, e.target.value)}
            size="small"
            fullWidth
            placeholder="go, goes"
            sx={muTextFieldSx}
            helperText="Nhiều đáp án chấp nhận — cách nhau bởi dấu phẩy"
          />
        ))}

        <TextField
          label="Giải thích (tuỳ chọn)"
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          size="small"
          fullWidth
          multiline
          minRows={2}
          sx={muTextFieldSx}
        />
      </Box>
    </Box>
  );
}
