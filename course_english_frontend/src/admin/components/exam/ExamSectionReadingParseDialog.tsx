import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { draftsToExerciseQuestions } from "../../../shared/ai/questionGen/draftToExercise";
import type { AiDraftQuestion } from "../../../shared/ai/questionGen/types";
import { apiGenerateReadingSection, apiParseReadingBlock } from "../../../shared/api/examPaper";
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";

type ExamSectionReadingParseDialogProps = {
  open: boolean;
  sectionTitle?: string;
  sectionInstruction?: string;
  onClose: () => void;
  onApplied: (payloadJson: string) => void;
};

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "IELTS 5.5", "IELTS 6.5", "IELTS 7.5"];

function parseExpectedCounts(input: string): number[] {
  return input
    .split(/[,\s]+/)
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.floor(n));
}

export function ExamSectionReadingParseDialog({
  open,
  sectionTitle,
  sectionInstruction,
  onClose,
  onApplied,
}: ExamSectionReadingParseDialogProps) {
  const [tab, setTab] = useState(0);
  const [rawText, setRawText] = useState("");
  const [expectedCountsText, setExpectedCountsText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [genCountsText, setGenCountsText] = useState("4");
  const [grade, setGrade] = useState(10);
  const [languageLevel, setLanguageLevel] = useState("B1");
  const [difficulty, setDifficulty] = useState(2);
  const [promptLang, setPromptLang] = useState("en");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);

  const reset = () => {
    setTab(0);
    setRawText("");
    setExpectedCountsText("");
    setPrompt("");
    setGenCountsText("4");
    setGrade(10);
    setLanguageLevel("B1");
    setDifficulty(2);
    setPromptLang("en");
    setProcessing(false);
    setError("");
    setWarnings([]);
    setDrafts([]);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const preview = useMemo(() => {
    const questions = draftsToExerciseQuestions(drafts);
    const reading = questions.filter((q) => q.type === "READING_COMPREHENSION");
    return {
      passageCount: reading.length,
      subCounts: reading.map((q) => q.subQuestions.length),
    };
  }, [drafts]);

  const handleParse = async () => {
    if (rawText.trim().length < 80) {
      setError("Nội dung cần tối thiểu 80 ký tự.");
      return;
    }
    setProcessing(true);
    setError("");
    setWarnings([]);
    setDrafts([]);
    try {
      const expected = parseExpectedCounts(expectedCountsText);
      const result = await apiParseReadingBlock({
        rawText: rawText.trim(),
        expectedSubQuestionCounts: expected.length ? expected : undefined,
      });
      const nextDrafts = (result.envelope?.questions ?? []) as AiDraftQuestion[];
      setDrafts(nextDrafts);
      setWarnings(result.warnings ?? []);
      if (!nextDrafts.length) {
        setError("AI chưa tách được passage nào. Hãy thử dán rõ ranh giới từng bài đọc.");
      }
    } catch (e) {
      setError((e as Error)?.message ?? "Không parse được block Reading.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (prompt.trim().length < 8) {
      setError("Prompt cần ít nhất 8 ký tự.");
      return;
    }
    setProcessing(true);
    setError("");
    setWarnings([]);
    setDrafts([]);
    try {
      const subQuestionCounts = parseExpectedCounts(genCountsText);
      const result = await apiGenerateReadingSection({
        prompt: prompt.trim(),
        subQuestionCounts: subQuestionCounts.length ? subQuestionCounts : undefined,
        difficulty,
        promptLang,
        grade,
        languageLevel,
        sectionInstruction: sectionInstruction?.trim() || undefined,
      });
      const nextDrafts = (result.envelope?.questions ?? []) as AiDraftQuestion[];
      setDrafts(nextDrafts);
      setWarnings(result.warnings ?? []);
      if (!nextDrafts.length) {
        setError("AI chưa sinh được passage nào. Thử chỉnh prompt hoặc số câu mỗi passage.");
      }
    } catch (e) {
      setError((e as Error)?.message ?? "Không sinh được Reading từ prompt.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = () => {
    const questions = draftsToExerciseQuestions(drafts);
    if (!questions.length) {
      setError("Không có dữ liệu hợp lệ để áp dụng.");
      return;
    }
    const payloadJson = buildExerciseSetPayloadJson({
      title: sectionTitle,
      instruction: sectionInstruction,
      questions,
    });
    onApplied(payloadJson);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle>Reading AI — section</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Dán đề có sẵn" />
          <Tab label="Sinh từ prompt" />
        </Tabs>

        {tab === 0 ? (
          <>
            <Typography sx={{ fontSize: 12, color: "#666", mb: 1 }}>
              Dán nguyên block gồm passage + câu hỏi. Ví dụ 3 bài đọc: nhập kỳ vọng{" "}
              <strong>5,3,4</strong>.
            </Typography>
            <TextField
              label="Kỳ vọng số câu mỗi passage (tuỳ chọn)"
              placeholder="5,3,4"
              size="small"
              fullWidth
              sx={{ ...muTextFieldSx, mb: 1.5 }}
              value={expectedCountsText}
              onChange={(e) => setExpectedCountsText(e.target.value)}
            />
            <TextField
              label="Block Reading"
              multiline
              minRows={12}
              fullWidth
              sx={muTextFieldSx}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 12, color: "#666", mb: 1 }}>
              AI tự viết passage + câu hỏi. Ví dụ prompt: &quot;B1, chủ đề môi trường, 3 đoạn ngắn
              cho học sinh lớp 10&quot;.
            </Typography>
            <TextField
              label="Prompt / chủ đề"
              multiline
              minRows={4}
              fullWidth
              sx={{ ...muTextFieldSx, mb: 1.5 }}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="B1 reading about environment protection for grade 10..."
            />
            <TextField
              label="Số câu mỗi passage"
              placeholder="5,3,4 hoặc 6"
              size="small"
              fullWidth
              sx={{ ...muTextFieldSx, mb: 1.5 }}
              value={genCountsText}
              onChange={(e) => setGenCountsText(e.target.value)}
              helperText="Một số = 1 passage. Nhiều số cách nhau dấu phẩy = nhiều passage."
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <TextField
                select
                label="Lớp"
                size="small"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                sx={{ ...muTextFieldSx, width: 100 }}
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Trình độ"
                size="small"
                value={languageLevel}
                onChange={(e) => setLanguageLevel(e.target.value)}
                sx={{ ...muTextFieldSx, minWidth: 140 }}
              >
                {LANGUAGE_LEVELS.map((lv) => (
                  <MenuItem key={lv} value={lv}>
                    {lv}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Độ khó"
                size="small"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                sx={{ ...muTextFieldSx, width: 100 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Ngôn ngữ câu"
                size="small"
                value={promptLang}
                onChange={(e) => setPromptLang(e.target.value)}
                sx={{ ...muTextFieldSx, width: 110 }}
              />
            </Box>
          </>
        )}

        {error ? (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        ) : null}
        {warnings.map((w) => (
          <Alert key={w} severity="warning" sx={{ mt: 1.5 }}>
            {w}
          </Alert>
        ))}

        {drafts.length > 0 ? (
          <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Passage: ${preview.passageCount}`} size="small" />
            <Chip label={`Sub-questions: ${preview.subCounts.join(" / ") || "0"}`} size="small" />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button sx={muFooterBtnOutlined} onClick={onClose} disabled={processing}>
          Hủy
        </Button>
        {tab === 0 ? (
          <Button
            sx={muFooterBtnOutlined}
            startIcon={processing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighOutlinedIcon />}
            onClick={() => void handleParse()}
            disabled={processing}
          >
            {processing ? "Đang tách..." : "AI tách Reading"}
          </Button>
        ) : (
          <Button
            sx={muFooterBtnOutlined}
            startIcon={processing ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
            onClick={() => void handleGenerate()}
            disabled={processing}
          >
            {processing ? "Đang sinh..." : "AI sinh Reading"}
          </Button>
        )}
        <Button sx={muFooterBtnPrimary} onClick={handleApply} disabled={!drafts.length || processing}>
          Áp dụng vào section
        </Button>
      </DialogActions>
    </Dialog>
  );
}
