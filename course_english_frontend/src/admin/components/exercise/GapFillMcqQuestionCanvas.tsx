import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
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
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import { syncGapFillBlanksWithPrompt } from "../../../shared/lesson/gapFillMcqUtils";
import type { GapFillMcqQuestion } from "../../../student/lessonPlayer/exercise/types";

type GapFillMcqQuestionCanvasProps = {
  question: GapFillMcqQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: GapFillMcqQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function GapFillMcqQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: GapFillMcqQuestionCanvasProps) {
  const updatePrompt = (text: string) => {
    const blanks = syncGapFillBlanksWithPrompt(text, question.blanks);
    onChange({
      ...question,
      prompt: { ...question.prompt, text },
      blanks,
    });
  };

  const updateChoiceText = (blankId: string, choiceId: string, text: string) => {
    onChange({
      ...question,
      blanks: question.blanks.map((blank) =>
        blank.id === blankId
          ? {
              ...blank,
              choices: blank.choices.map((c) => (c.id === choiceId ? { ...c, text } : c)),
            }
          : blank,
      ),
    });
  };

  const updateCorrectChoice = (blankId: string, correctChoiceId: string) => {
    onChange({
      ...question,
      blanks: question.blanks.map((blank) =>
        blank.id === blankId ? { ...blank, correctChoiceId } : blank,
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
          <RuleOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0C447C" }}>
            Chọn điền khuyết (GAP_FILL_MCQ)
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
          label='Đoạn văn (dùng "___" cho chỗ trống)'
          value={question.prompt.text}
          onChange={(e) => updatePrompt(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={3}
          placeholder="Every morning I ___ up. Then I ___ breakfast."
          sx={muTextFieldSx}
          helperText="Mỗi ___ = một dropdown 4 lựa chọn — chấm điểm từng ô"
        />

        {question.blanks.map((blank, blankIndex) => (
          <Box
            key={blank.id}
            sx={{
              p: 1.5,
              border: "1px solid #ECEAE3",
              borderRadius: "8px",
              bgcolor: "#FAFAF8",
              display: "grid",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0C447C" }}>
              Ô {blankIndex + 1} ({blank.id})
            </Typography>
            {blank.choices.map((choice) => (
              <TextField
                key={choice.id}
                label={`Lựa chọn ${choice.id.toUpperCase()}`}
                value={choice.text}
                onChange={(e) => updateChoiceText(blank.id, choice.id, e.target.value)}
                size="small"
                fullWidth
                sx={muTextFieldSx}
              />
            ))}
            <RadioGroup
              row
              value={blank.correctChoiceId}
              onChange={(e) => updateCorrectChoice(blank.id, e.target.value)}
            >
              {blank.choices.map((choice) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio size="small" />}
                  label={`Đúng: ${choice.id.toUpperCase()}`}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                />
              ))}
            </RadioGroup>
          </Box>
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
