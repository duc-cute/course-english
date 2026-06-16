import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";
import { createEmptyReadingSubQuestion } from "../../../shared/lesson/exercisePayload";
import { READING_PRESENTATION_OPTIONS } from "../../../shared/lesson/readingComprehensionUtils";
import type { ReadingComprehensionQuestion } from "../../../student/lessonPlayer/exercise/types";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

type ReadingComprehensionQuestionCanvasProps = {
  question: ReadingComprehensionQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: ReadingComprehensionQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function ReadingComprehensionQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: ReadingComprehensionQuestionCanvasProps) {
  const addSubQuestion = () => {
    onChange({
      ...question,
      subQuestions: [...question.subQuestions, createEmptyReadingSubQuestion()],
    });
  };

  const updateSub = (subId: string, patch: Partial<ReadingComprehensionQuestion["subQuestions"][0]>) => {
    onChange({
      ...question,
      subQuestions: question.subQuestions.map((sub) =>
        sub.id === subId ? { ...sub, ...patch } : sub,
      ),
    });
  };

  const removeSub = (subId: string) => {
    if (question.subQuestions.length <= 1) return;
    onChange({
      ...question,
      subQuestions: question.subQuestions.filter((sub) => sub.id !== subId),
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
          <MenuBookOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0C447C" }}>
            Đọc hiểu (READING_COMPREHENSION)
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
        <FormControl size="small" fullWidth sx={muTextFieldSx}>
          <InputLabel>Chế độ hiển thị</InputLabel>
          <Select
            label="Chế độ hiển thị"
            value={question.presentation ?? "split"}
            onChange={(e) =>
              onChange({
                ...question,
                presentation: e.target.value as ReadingComprehensionQuestion["presentation"],
              })
            }
          >
            {READING_PRESENTATION_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Tiêu đề đoạn (tuỳ chọn)"
          value={question.passage.title ?? ""}
          onChange={(e) =>
            onChange({
              ...question,
              passage: { ...question.passage, title: e.target.value },
            })
          }
          size="small"
          fullWidth
          sx={muTextFieldSx}
        />

        <TextField
          label="Đoạn đọc"
          value={question.passage.text}
          onChange={(e) =>
            onChange({
              ...question,
              passage: { ...question.passage, text: e.target.value },
            })
          }
          size="small"
          fullWidth
          multiline
          minRows={5}
          sx={muTextFieldSx}
        />

        {question.subQuestions.map((sub, subIndex) => (
          <Box
            key={sub.id}
            sx={{
              p: 1.5,
              border: "1px solid #ECEAE3",
              borderRadius: "8px",
              bgcolor: "#FAFAF8",
              display: "grid",
              gap: 1.25,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0C447C" }}>
                Câu hỏi {subIndex + 1}
              </Typography>
              {question.subQuestions.length > 1 ? (
                <IconButton size="small" color="error" onClick={() => removeSub(sub.id)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Box>

            <TextField
              label="Câu hỏi"
              value={sub.prompt.text}
              onChange={(e) =>
                updateSub(sub.id, { prompt: { ...sub.prompt, text: e.target.value } })
              }
              size="small"
              fullWidth
              multiline
              minRows={2}
              sx={muTextFieldSx}
            />

            {sub.choices.map((choice, ci) => (
              <TextField
                key={choice.id}
                label={`Đáp án ${CHOICE_LABELS[ci] ?? choice.id.toUpperCase()}`}
                value={choice.text}
                onChange={(e) =>
                  updateSub(sub.id, {
                    choices: sub.choices.map((c) =>
                      c.id === choice.id ? { ...c, text: e.target.value } : c,
                    ),
                  })
                }
                size="small"
                fullWidth
                sx={muTextFieldSx}
              />
            ))}

            <RadioGroup
              row
              value={sub.correctChoiceId}
              onChange={(e) => updateSub(sub.id, { correctChoiceId: e.target.value })}
            >
              {sub.choices.map((choice, ci) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio size="small" />}
                  label={CHOICE_LABELS[ci] ?? choice.id.toUpperCase()}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                />
              ))}
            </RadioGroup>
          </Box>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={addSubQuestion}
          sx={{ textTransform: "none", borderColor: "#0C447C", color: "#0C447C" }}
        >
          Thêm câu hỏi
        </Button>

        <TextField
          label="Giải thích chung (tuỳ chọn)"
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
