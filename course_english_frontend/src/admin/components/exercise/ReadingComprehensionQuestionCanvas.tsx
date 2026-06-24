import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
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

      <Box sx={{ p: { xs: 2, md: 3 }, display: "grid", gap: 3 }}>
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

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
            Tiêu đề đoạn (tuỳ chọn)
          </Typography>
          <TextField
            placeholder="Nhập tiêu đề..."
            value={question.passage.title ?? ""}
            onChange={(e) =>
              onChange({
                ...question,
                passage: { ...question.passage, title: e.target.value },
              })
            }
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 14,
                bgcolor: "#fff",
                "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#0C447C" },
              },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
            Đoạn đọc
          </Typography>
          <TextField
            placeholder="Dán hoặc nhập đoạn văn tiếng Anh..."
            value={question.passage.text}
            onChange={(e) =>
              onChange({
                ...question,
                passage: { ...question.passage, text: e.target.value },
              })
            }
            fullWidth
            multiline
            minRows={5}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 14,
                lineHeight: 1.6,
                bgcolor: "#fff",
                "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#0C447C" },
              },
            }}
          />
        </Box>

        <Box sx={{ display: "grid", gap: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0b1c30" }}>
            Câu hỏi theo đoạn đọc
          </Typography>

          {question.subQuestions.map((sub, subIndex) => (
            <Box
              key={sub.id}
              sx={{
                p: { xs: 2, md: 2.5 },
                border: "1px solid #E8E6DF",
                borderLeft: "3px solid #0C447C",
                borderRadius: "12px",
                bgcolor: "#fff",
                display: "grid",
                gap: 2,
                boxShadow: "0 1px 3px rgba(12, 68, 124, 0.04)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.35,
                    borderRadius: "6px",
                    bgcolor: "rgba(12, 68, 124, 0.08)",
                    color: "#0C447C",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Câu hỏi {subIndex + 1}
                </Box>
                {question.subQuestions.length > 1 ? (
                  <Tooltip title="Xóa câu hỏi">
                    <IconButton size="small" onClick={() => removeSub(sub.id)} aria-label="Xóa câu hỏi">
                      <DeleteOutlineIcon sx={{ fontSize: 18, color: "#BA1A1A" }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
                  Nội dung câu hỏi
                </Typography>
                <TextField
                  multiline
                  minRows={2}
                  fullWidth
                  placeholder="Nhập câu hỏi (tiếng Anh)..."
                  value={sub.prompt.text}
                  onChange={(e) =>
                    updateSub(sub.id, { prompt: { ...sub.prompt, text: e.target.value } })
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
                  Đáp án — chọn đáp án đúng
                </Typography>
                <Box sx={{ display: "grid", gap: 1.25 }}>
                  {sub.choices.map((choice, ci) => {
                    const isCorrect = choice.id === sub.correctChoiceId;
                    const label = CHOICE_LABELS[ci] ?? choice.id.toUpperCase();

                    return (
                      <Box key={choice.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Radio
                          size="small"
                          checked={isCorrect}
                          onChange={() => updateSub(sub.id, { correctChoiceId: choice.id })}
                          sx={{ p: 0.5 }}
                        />
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            border: isCorrect ? "2px solid #0C447C" : "1px solid #ECEAE3",
                            borderRadius: "10px",
                            bgcolor: isCorrect ? "rgba(12, 68, 124, 0.04)" : "#FAFAF8",
                            overflow: "hidden",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <Box
                            sx={{
                              px: 1.5,
                              py: 1.25,
                              fontSize: 12,
                              fontWeight: 700,
                              color: isCorrect ? "#0C447C" : "#888780",
                              borderRight: isCorrect
                                ? "1px solid rgba(12,68,124,0.2)"
                                : "1px solid #ECEAE3",
                              bgcolor: isCorrect ? "rgba(12, 68, 124, 0.06)" : "#F3F2EE",
                              minWidth: 36,
                              textAlign: "center",
                            }}
                          >
                            {label}
                          </Box>
                          <TextField
                            variant="standard"
                            fullWidth
                            placeholder={`Đáp án ${label}`}
                            value={choice.text}
                            onChange={(e) =>
                              updateSub(sub.id, {
                                choices: sub.choices.map((c) =>
                                  c.id === choice.id ? { ...c, text: e.target.value } : c,
                                ),
                              })
                            }
                            InputProps={{ disableUnderline: true }}
                            sx={{
                              px: 1.5,
                              "& input": {
                                fontSize: 14,
                                fontWeight: isCorrect ? 600 : 400,
                                py: 1.25,
                              },
                            }}
                          />
                          {isCorrect ? (
                            <CheckCircleIcon
                              sx={{ fontSize: 20, color: "#0C447C", mr: 1, flexShrink: 0 }}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={addSubQuestion}
          sx={{ textTransform: "none", borderColor: "#0C447C", color: "#0C447C" }}
        >
          Thêm câu hỏi
        </Button>

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 0.75 }}>
            Giải thích chung (tuỳ chọn)
          </Typography>
          <TextField
            placeholder="Thêm gợi ý hoặc giải thích sau khi chấm..."
            value={question.explanation ?? ""}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            fullWidth
            multiline
            minRows={2}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 14,
                bgcolor: "#FAFAF8",
                "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#0C447C" },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
