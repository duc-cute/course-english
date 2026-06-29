import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
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
import { syncGapFillBlanksWithPrompt } from "../../../shared/lesson/gapFillMcqUtils";
import type { GapFillMcqQuestion } from "../../../student/lessonPlayer/exercise/types";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

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
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0b1c30" }}>
            Chọn điền khuyết
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
            Đoạn văn — dùng <strong>___</strong> cho mỗi chỗ trống
          </Typography>
          <TextField
            multiline
            minRows={4}
            fullWidth
            spellCheck={false}
            placeholder="Every morning I ___ up. Then I ___ breakfast."
            value={question.prompt.text}
            onChange={(e) => updatePrompt(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 14,
                lineHeight: 1.55,
                "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#0C447C" },
              },
            }}
          />
          <Typography sx={{ fontSize: 11, color: "#888780", mt: 0.75 }}>
            {question.blanks.length} ô trống — mỗi ô có 4 lựa chọn A/B/C/D
          </Typography>
        </Box>

        {question.blanks.length > 0 ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A" }}>
              Lựa chọn từng ô — chọn đáp án đúng
            </Typography>
            {question.blanks.map((blank, blankIndex) => {
              const correctChoice = blank.choices.find((c) => c.id === blank.correctChoiceId);
              const correctPreview = correctChoice?.text.trim();

              return (
                <Accordion
                  key={blank.id}
                  disableGutters
                  elevation={0}
                  defaultExpanded={blankIndex === 0}
                  sx={{
                    border: "1px solid #ECEAE3",
                    borderRadius: "10px !important",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": { margin: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 44,
                      "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 },
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0b1c30" }}>
                      Ô {blankIndex + 1}
                    </Typography>
                    {correctPreview ? (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#0C447C",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        → {correctPreview}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#888780", fontStyle: "italic" }}>
                        Chưa chọn đáp án
                      </Typography>
                    )}
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 1.5, display: "grid", gap: 0.75 }}>
                    {blank.choices.map((choice, choiceIndex) => {
                      const isCorrect = choice.id === blank.correctChoiceId;
                      const label = CHOICE_LABELS[choiceIndex] ?? choice.id.toUpperCase();

                      return (
                        <Box key={choice.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Radio
                            size="small"
                            checked={isCorrect}
                            onChange={() => updateCorrectChoice(blank.id, choice.id)}
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
                                borderRight: isCorrect
                                  ? "1px solid rgba(12,68,124,0.2)"
                                  : "1px solid #ECEAE3",
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
                              spellCheck={false}
                              placeholder={`Lựa chọn ${label}`}
                              value={choice.text}
                              onChange={(e) => updateChoiceText(blank.id, choice.id, e.target.value)}
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
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ) : null}

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
