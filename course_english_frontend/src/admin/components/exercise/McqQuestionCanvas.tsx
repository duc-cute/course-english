import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Radio,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  extractArrangementItemsFromPrompt,
  extractStemBeforeArrangementItems,
  MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
  normalizeMcqArrangementFields,
  sanitizeArrangementItems,
} from "../../../shared/lesson/mcqArrangementUtils";
import type { MultipleChoiceQuestion } from "../../../student/lessonPlayer/exercise/types";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

const EMPTY_ARRANGEMENT_ITEMS = [
  { key: "a", text: "" },
  { key: "b", text: "" },
  { key: "c", text: "" },
  { key: "d", text: "" },
  { key: "e", text: "" },
] as const;

/** Temp migrate: split flat prompt → items, or scaffold a–e for manual edit. */
function ensureArrangementItems(question: MultipleChoiceQuestion): MultipleChoiceQuestion {
  const normalized = normalizeMcqArrangementFields(question);
  const cleaned = sanitizeArrangementItems(normalized.items ?? []);
  if (cleaned.length >= 3) {
    return { ...normalized, layout: MCQ_LAYOUT_SENTENCE_ARRANGEMENT, items: cleaned };
  }

  const fromPrompt = extractArrangementItemsFromPrompt(question.prompt.text);
  if (fromPrompt.length >= 3) {
    return {
      ...question,
      layout: MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
      prompt: {
        ...question.prompt,
        text: extractStemBeforeArrangementItems(question.prompt.text),
      },
      items: fromPrompt,
    };
  }

  return {
    ...question,
    layout: MCQ_LAYOUT_SENTENCE_ARRANGEMENT,
    items: EMPTY_ARRANGEMENT_ITEMS.map((item) => ({ ...item })),
  };
}

type McqQuestionCanvasProps = {
  question: MultipleChoiceQuestion;
  index: number;
  canDelete: boolean;
  onChange: (next: MultipleChoiceQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function McqQuestionCanvas({
  question,
  index,
  canDelete,
  onChange,
  onDelete,
  onDuplicate,
}: McqQuestionCanvasProps) {
  const updateChoice = (choiceId: string, text: string) => {
    onChange({
      ...question,
      choices: question.choices.map((c) => (c.id === choiceId ? { ...c, text } : c)),
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
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0b1c30" }}>
            Trắc nghiệm (MCQ)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Tooltip title="Tách / thêm items a–e (Sentence Arrangement — tạm)">
            <IconButton
              size="small"
              onClick={() => onChange(ensureArrangementItems(question))}
              aria-label="Thêm items sắp xếp câu"
              sx={{
                color: "#0C447C",
                bgcolor:
                  (question.items?.length ?? 0) >= 3
                    ? "transparent"
                    : "rgba(12, 68, 124, 0.08)",
              }}
            >
              <FormatListNumberedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
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
            placeholder="Nhập câu hỏi (tiếng Anh)..."
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

        {(sanitizeArrangementItems(question.items ?? []).length >= 3 ||
          question.layout === "SENTENCE_ARRANGEMENT") ? (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 1 }}>
              Các câu cần sắp xếp (a–e)
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {sanitizeArrangementItems(question.items ?? []).map((item, index) => (
                <Box key={`${item.key}-${index}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box
                    sx={{
                      mt: 1,
                      minWidth: 28,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0C447C",
                      textAlign: "center",
                    }}
                  >
                    {item.key}.
                  </Box>
                  <TextField
                    multiline
                    minRows={1}
                    fullWidth
                    value={item.text}
                    onChange={(e) => {
                      const cleaned = sanitizeArrangementItems(question.items ?? []);
                      const nextItems = cleaned.map((row, i) =>
                        i === index ? { ...row, text: e.target.value } : row,
                      );
                      onChange({
                        ...question,
                        layout: "SENTENCE_ARRANGEMENT",
                        items: nextItems,
                      });
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        fontSize: 14,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", mb: 1 }}>
            Đáp án — chọn đáp án đúng
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {question.choices.map((choice, i) => {
              const isCorrect = choice.id === question.correctChoiceId;
              const label = CHOICE_LABELS[i] ?? choice.id.toUpperCase();

              return (
                <Box key={choice.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Radio
                    size="small"
                    checked={isCorrect}
                    onChange={() => onChange({ ...question, correctChoiceId: choice.id })}
                    sx={{ p: 0.5 }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      border: isCorrect ? "2px solid #0C447C" : "1px solid #ECEAE3",
                      borderRadius: "10px",
                      bgcolor: isCorrect ? "rgba(12, 68, 124, 0.04)" : "#fff",
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
                        borderRight: isCorrect ? "1px solid rgba(12,68,124,0.2)" : "1px solid #ECEAE3",
                        bgcolor: isCorrect ? "rgba(12, 68, 124, 0.06)" : "#FAFAF8",
                        minWidth: 32,
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
                      onChange={(e) => updateChoice(choice.id, e.target.value)}
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
                      <CheckCircleIcon sx={{ fontSize: 20, color: "#0C447C", mr: 1, flexShrink: 0 }} />
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid #ECEAE3",
            borderRadius: "10px !important",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SchoolOutlinedIcon sx={{ fontSize: 18, color: "#0C447C" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Giải thích cho học sinh</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <TextField
              multiline
              minRows={2}
              fullWidth
              placeholder="Thêm gợi ý hoặc giải thích sau khi chấm..."
              value={question.explanation ?? ""}
              onChange={(e) => onChange({ ...question, explanation: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "#FAFAF8",
                  fontSize: 14,
                },
              }}
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
