import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import {
  AI_GEN_PROCESSING_TIP,
  AI_TASK_POLL_INTERVAL_MS,
  AI_TASK_POLL_MAX_MS,
} from "../../../shared/ai/questionGen/aiTaskPolling";
import { draftsToExerciseQuestions } from "../../../shared/ai/questionGen/draftToExercise";
import {
  AI_GEN_QUESTION_TYPE_OPTIONS,
  type AiDraftQuestion,
  type AiGenQuestionType,
} from "../../../shared/ai/questionGen/types";
import {
  apiCreateQuestionGenTask,
  apiGetAiTask,
  apiListAiTaskHistory,
  apiPatchAiTaskDraft,
  apiPreviewQuestionGenPrompt,
  apiReportAiTaskPollTimeout,
  type AiQuestionGenPromptPreview,
  type AiTaskHistoryItem,
  type CreateQuestionGenTaskPayload,
} from "../../../shared/api/aiTask";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AiDraftPreviewRow } from "./AiDraftPreviewRow";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "./AiGenProcessingPanel";

const STEPS = ["Cấu hình", "Xem prompt", "Đang sinh", "Xem trước"] as const;

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "IELTS 5.5", "IELTS 6.5", "IELTS 7.5"];

const DEFAULT_QUOTAS: Partial<Record<AiGenQuestionType, number>> = {
  MULTIPLE_CHOICE: 10,
  READING_COMPREHENSION: 3,
};

type AiAutoExerciseGenDialogProps = {
  open: boolean;
  onClose: () => void;
  /** replace = thay toàn bộ bài tập; append = thêm vào cuối */
  applyMode?: "replace" | "append";
  onApplied: (questions: ExerciseQuestion[], mode: "replace" | "append") => void;
};

function toggleDraftSelection(drafts: AiDraftQuestion[], tempId: string, selected: boolean) {
  return drafts.map((d) => (d.tempId === tempId ? { ...d, selected } : d));
}

function normalizeDrafts(questions: AiDraftQuestion[]): AiDraftQuestion[] {
  return questions.map((q) => ({
    ...q,
    selected: q.selected !== false,
    validationErrors: q.validationErrors ?? [],
  }));
}

function sumQuotas(quotas: Partial<Record<AiGenQuestionType, number>>): number {
  return Object.values(quotas).reduce((sum, n) => sum + (n ?? 0), 0);
}

function quotaTypeLabel(type: AiGenQuestionType): string {
  return AI_GEN_QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatHistoryDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function historyStatusChip(status?: string) {
  if (status === "DONE") return <Chip size="small" label="Xong" color="success" variant="outlined" />;
  if (status === "FAILED") return <Chip size="small" label="Lỗi" color="error" variant="outlined" />;
  if (status === "PROCESSING" || status === "PENDING") {
    return <Chip size="small" label="Đang chạy" color="warning" variant="outlined" />;
  }
  return null;
}

function activeQuotas(quotas: Partial<Record<AiGenQuestionType, number>>) {
  return Object.fromEntries(
    Object.entries(quotas).filter(([, count]) => (count ?? 0) > 0),
  ) as Partial<Record<AiGenQuestionType, number>>;
}

export function AiAutoExerciseGenDialog({
  open,
  onClose,
  applyMode = "replace",
  onApplied,
}: AiAutoExerciseGenDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pollStartedRef = useRef(0);

  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(10);
  const [languageLevel, setLanguageLevel] = useState("B1");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [typeQuotas, setTypeQuotas] = useState(DEFAULT_QUOTAS);
  const [readingSubQuestionCount, setReadingSubQuestionCount] = useState(4);
  const [difficulty, setDifficulty] = useState(3);
  const [promptLang, setPromptLang] = useState("en");
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [pollElapsedSec, setPollElapsedSec] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [genSummaryMessage, setGenSummaryMessage] = useState("");
  const [promptPreview, setPromptPreview] = useState<AiQuestionGenPromptPreview | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Partial<Record<AiGenQuestionType, string>>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [historyItems, setHistoryItems] = useState<AiTaskHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setTopic("");
    setGrade(10);
    setLanguageLevel("B1");
    setAdditionalInstructions("");
    setTypeQuotas({ ...DEFAULT_QUOTAS });
    setReadingSubQuestionCount(4);
    setDifficulty(3);
    setPromptLang("en");
    setDrafts([]);
    setTaskId(null);
    setProcessing(false);
    setApplying(false);
    setError("");
    setPollElapsedSec(0);
    setProgressMessage("");
    setProgressPercent(null);
    setGenSummaryMessage("");
    setPromptPreview(null);
    setCustomPrompts({});
    setLoadingPreview(false);
    setHistoryItems([]);
    pollStartedRef.current = 0;
  }, []);

  const handleClose = () => {
    if (processing || applying) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    reset();
    setLoadingHistory(true);
    void apiListAiTaskHistory(0, 12)
      .then((page) => setHistoryItems(page.result ?? []))
      .catch(() => setHistoryItems([]))
      .finally(() => setLoadingHistory(false));
  }, [open, reset]);

  const buildTaskPayload = useCallback((): CreateQuestionGenTaskPayload | null => {
    const quotas = activeQuotas(typeQuotas);
    const total = sumQuotas(quotas);
    if (!topic.trim()) {
      setError("Nhập chủ đề bài tập.");
      return null;
    }
    if (total < 1 || total > 50) {
      setError("Tổng số item phải từ 1 đến 50.");
      return null;
    }
    if (Object.keys(quotas).length === 0) {
      setError("Chọn ít nhất một loại câu với số lượng > 0.");
      return null;
    }
    const overrides = Object.fromEntries(
      Object.entries(customPrompts).filter(([, v]) => v != null && String(v).trim().length > 0),
    ) as Partial<Record<AiGenQuestionType, string>>;
    return {
      topic: topic.trim(),
      grade,
      languageLevel,
      additionalInstructions: additionalInstructions.trim() || undefined,
      typeQuotas: quotas,
      readingSubQuestionCount,
      difficulty,
      promptLang,
      ...(Object.keys(overrides).length > 0 ? { customUserPromptByType: overrides } : {}),
    };
  }, [
    topic,
    grade,
    languageLevel,
    additionalInstructions,
    typeQuotas,
    readingSubQuestionCount,
    difficulty,
    promptLang,
    customPrompts,
  ]);

  const goToPromptPreview = async () => {
    const payload = buildTaskPayload();
    if (!payload) return;
    setError("");
    setLoadingPreview(true);
    try {
      const preview = await apiPreviewQuestionGenPrompt(payload);
      setPromptPreview(preview);
      const initial: Partial<Record<AiGenQuestionType, string>> = {};
      for (const batch of preview.batches ?? []) {
        initial[batch.questionType] = batch.userPrompt;
      }
      setCustomPrompts(initial);
      setStep(1);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không tạo được preview prompt.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const reopenHistoryItem = async (item: AiTaskHistoryItem) => {
    if (item.status !== "DONE") {
      setError("Chỉ mở lại được lần sinh đã hoàn thành.");
      return;
    }
    setError("");
    try {
      const task = await apiGetAiTask(item.id);
      if (task.status !== "DONE" || !task.outputJson?.questions?.length) {
        setError("Lần sinh này chưa có kết quả để xem.");
        return;
      }
      setTaskId(item.id);
      setDrafts(normalizeDrafts(task.outputJson.questions));
      setGenSummaryMessage(task.outputJson.meta?.summaryMessage ?? item.summaryMessage ?? "");
      setStep(3);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không mở được lịch sử.");
    }
  };

  const applyTaskProgress = (task: { progressMessage?: string | null; progressPercent?: number | null }) => {
    if (task.progressMessage) setProgressMessage(task.progressMessage);
    if (task.progressPercent != null) setProgressPercent(task.progressPercent);
  };

  const setQuota = (type: AiGenQuestionType, value: number) => {
    setTypeQuotas((prev) => {
      const next = { ...prev, [type]: Math.max(0, value) };
      if (next[type] === 0) delete next[type];
      return next;
    });
  };

  const startGeneration = async () => {
    const payload = buildTaskPayload();
    if (!payload) return;

    setError("");
    setStep(2);
    setProcessing(true);
    setProgressMessage("Đang khởi tạo tác vụ AI…");
    pollStartedRef.current = Date.now();

    try {
      const body = await apiCreateQuestionGenTask(payload);
      const id = body.taskId ?? (body as { id?: string }).id;
      if (!id) throw new Error("Không nhận được taskId");
      setTaskId(id);
    } catch (err) {
      setProcessing(false);
      setStep(1);
      setError((err as { message?: string })?.message ?? "Không tạo được tác vụ sinh bài tập.");
    }
  };

  useEffect(() => {
    if (!open || step !== 2 || !processing) {
      setPollElapsedSec(0);
      return;
    }
    const tick = window.setInterval(() => {
      if (pollStartedRef.current > 0) {
        setPollElapsedSec(Math.floor((Date.now() - pollStartedRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [open, step, processing]);

  useEffect(() => {
    if (!open || step !== 2 || !taskId || !processing) return;

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - pollStartedRef.current > AI_TASK_POLL_MAX_MS) {
        setProcessing(false);
        setError("Xử lý quá lâu. Thử giảm số câu hoặc thử lại sau.");
        setStep(1);
        void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
        return;
      }
      try {
        const task = await apiGetAiTask(taskId);
        applyTaskProgress(task);
        if (task.status === "DONE") {
          setDrafts(normalizeDrafts(task.outputJson?.questions ?? []));
          setGenSummaryMessage(task.outputJson?.meta?.summaryMessage ?? "");
          setProcessing(false);
          setStep(3);
          void apiListAiTaskHistory(0, 12)
            .then((page) => setHistoryItems(page.result ?? []))
            .catch(() => undefined);
          return;
        }
        if (task.status === "FAILED") {
          setProcessing(false);
          setError(task.errorMessage ?? "Sinh bài tập thất bại.");
          setStep(1);
          return;
        }
      } catch (err) {
        setProcessing(false);
        setError((err as { message?: string })?.message ?? "Không lấy được trạng thái tác vụ.");
        setStep(1);
        return;
      }
      if (!cancelled) window.setTimeout(() => void poll(), AI_TASK_POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [open, step, taskId, processing]);

  const selectedCount = drafts.filter((d) => d.selected && !(d.validationErrors?.length)).length;

  const handleApply = async () => {
    setError("");
    setApplying(true);
    try {
      let currentDrafts = drafts;
      if (taskId) {
        const task = await apiPatchAiTaskDraft(taskId, { questions: drafts });
        currentDrafts = normalizeDrafts(task.outputJson?.questions ?? drafts);
        setDrafts(currentDrafts);
      }
      const next = draftsToExerciseQuestions(currentDrafts);
      if (!next.length) {
        setError("Chọn ít nhất một câu hợp lệ.");
        return;
      }
      onApplied(next, applyMode);
      handleClose();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không lưu được bản nháp.");
    } finally {
      setApplying(false);
    }
  };

  const totalItems = sumQuotas(typeQuotas);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      className={`ai-gen-dialog ai-auto-gen-dialog${isMobile ? " ai-gen-dialog--mobile" : ""}`}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          minHeight: isMobile ? "100%" : step === 2 ? 580 : 480,
          maxWidth: isMobile ? "100%" : "920px",
        },
      }}
    >
      <DialogTitle sx={{ pb: 0, pr: 6, position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeOutlinedIcon sx={{ color: "#2563eb" }} />
          <Typography component="span" sx={{ fontWeight: 700, fontSize: 18 }}>
            Sinh bài tập tự động bằng AI
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 16, top: 16 }}
          disabled={processing || applying}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
        <Stepper activeStep={step} alternativeLabel={!isMobile} sx={{ mb: 2 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? (
          <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }} onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {step === 0 ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: "#5F5E5A" }}>
              Mô tả chủ đề và số lượng từng loại câu. Ví dụ: 10 trắc nghiệm + 3 bài đọc hiểu (mỗi bài là một
              passage riêng).
            </Typography>
            <Box>
              <Typography sx={muFieldLabel}>Chủ đề *</Typography>
              <TextField
                fullWidth
                size="small"
                sx={muTextFieldSx}
                placeholder="Environment, Travel, Daily routines…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
              <Box>
                <Typography sx={muFieldLabel}>Khối lớp</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  sx={muTextFieldSx}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <MenuItem key={g} value={g}>
                      Lớp {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={muFieldLabel}>Trình độ</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  sx={muTextFieldSx}
                  value={languageLevel}
                  onChange={(e) => setLanguageLevel(e.target.value)}
                >
                  {LANGUAGE_LEVELS.map((lv) => (
                    <MenuItem key={lv} value={lv}>
                      {lv}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={muFieldLabel}>Độ khó (1–5)</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  sx={muTextFieldSx}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Box>
              <Typography sx={muFieldLabel}>Hướng dẫn thêm (tuỳ chọn)</Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={muTextFieldSx}
                placeholder="Focus on vocabulary about climate change…"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
              />
            </Box>
            <Box>
              <Typography sx={{ ...muFieldLabel, mb: 0.75 }}>Số lượng theo loại câu</Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {AI_GEN_QUESTION_TYPE_OPTIONS.map((opt) => (
                  <Box
                    key={opt.value}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px",
                      alignItems: "center",
                      gap: 1,
                      py: 0.5,
                      borderBottom: "1px solid #f0efe8",
                    }}
                  >
                    <Typography sx={{ fontSize: 13 }}>{opt.label}</Typography>
                    <TextField
                      type="number"
                      size="small"
                      sx={muTextFieldSx}
                      inputProps={{ min: 0, max: 50 }}
                      value={typeQuotas[opt.value] ?? 0}
                      onChange={(e) => setQuota(opt.value, Number(e.target.value))}
                    />
                  </Box>
                ))}
              </Box>
              <Typography sx={{ fontSize: 11, color: "#888780", mt: 0.75 }}>
                Tổng {totalItems} item top-level
                {(typeQuotas.READING_COMPREHENSION ?? 0) > 0
                  ? ` · Mỗi bài đọc hiểu = 1 passage riêng + ${readingSubQuestionCount} câu con`
                  : ""}
              </Typography>
            </Box>
            {(typeQuotas.READING_COMPREHENSION ?? 0) > 0 ? (
              <Box sx={{ maxWidth: 200 }}>
                <Typography sx={muFieldLabel}>Câu con / bài đọc</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  sx={muTextFieldSx}
                  inputProps={{ min: 2, max: 12 }}
                  value={readingSubQuestionCount}
                  onChange={(e) => setReadingSubQuestionCount(Number(e.target.value))}
                />
              </Box>
            ) : null}
            <Box sx={{ maxWidth: 160 }}>
              <Typography sx={muFieldLabel}>Ngôn ngữ câu hỏi</Typography>
              <TextField
                select
                fullWidth
                size="small"
                sx={muTextFieldSx}
                value={promptLang}
                onChange={(e) => setPromptLang(e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="vi">Tiếng Việt</MenuItem>
              </TextField>
            </Box>
            <Accordion disableGutters elevation={0} sx={{ border: "1px solid #eceae3", borderRadius: "8px !important" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <HistoryOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lịch sử sinh bài ({historyItems.length})</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, maxHeight: 200, overflow: "auto" }}>
                {loadingHistory ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : historyItems.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: "#888780", fontStyle: "italic" }}>
                    Chưa có lần sinh nào.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {historyItems.map((item) => (
                      <ListItemButton
                        key={item.id}
                        onClick={() => void reopenHistoryItem(item)}
                        disabled={item.status !== "DONE"}
                        sx={{ borderRadius: "6px", mb: 0.5 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{item.label ?? item.topic ?? "AI gen"}</Typography>
                              {historyStatusChip(item.status)}
                            </Box>
                          }
                          secondary={formatHistoryDate(item.createdAt)}
                          primaryTypographyProps={{ component: "div" }}
                          secondaryTypographyProps={{ sx: { fontSize: 11 } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        ) : null}

        {step === 1 ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: "#5F5E5A" }}>
              Xem prompt AI sẽ dùng. Bạn có thể chỉnh user prompt từng nhóm trước khi sinh — bỏ qua nếu không cần.
            </Typography>
            {promptPreview?.sourceExcerpt ? (
              <Accordion disableGutters elevation={0} sx={{ border: "1px solid #eceae3" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Topic brief (nguồn nội dung)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ fontSize: 11, color: "#64748b", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                    {promptPreview.sourceExcerpt}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ) : null}
            {(promptPreview?.batches ?? []).map((batch) => (
              <Accordion
                key={batch.questionType}
                defaultExpanded={promptPreview?.batches?.length === 1}
                disableGutters
                elevation={0}
                sx={{ border: "1px solid #dbeafe", borderRadius: "8px !important", mb: 0.5 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {quotaTypeLabel(batch.questionType)} × {batch.count}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "grid", gap: 1 }}>
                  <Box>
                    <Typography sx={{ ...muFieldLabel, fontSize: 11 }}>System prompt (chỉ đọc)</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={8}
                      size="small"
                      sx={muTextFieldSx}
                      value={batch.systemPrompt}
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ ...muFieldLabel, fontSize: 11 }}>User prompt (có thể sửa)</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={5}
                      maxRows={14}
                      size="small"
                      sx={muTextFieldSx}
                      value={customPrompts[batch.questionType] ?? batch.userPrompt}
                      onChange={(e) =>
                        setCustomPrompts((prev) => ({ ...prev, [batch.questionType]: e.target.value }))
                      }
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : null}

        {step === 2 ? (
          <Box className="ai-gen-processing ai-gen-processing--auto" sx={{ position: "relative", minHeight: 320 }}>
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              progressMessage={progressMessage}
              progressPercent={progressPercent}
              elapsedSec={pollElapsedSec}
            />
            <AiGenFunFactsPanel active={processing} />
          </Box>
        ) : null}

        {step === 3 ? (
          <Box>
            {genSummaryMessage ? (
              <Alert severity="info" sx={{ mb: 1.5, fontSize: 12 }}>
                {genSummaryMessage}
              </Alert>
            ) : null}
            <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1 }}>
              Xem trước và chỉnh sửa trước khi áp dụng vào bài tập.
            </Typography>
            {drafts.length === 0 ? (
              <Typography sx={{ fontSize: 12, fontStyle: "italic", color: "#888780" }}>
                Không có câu hỏi nào được sinh.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 0.75, maxHeight: 400, overflow: "auto" }}>
                {drafts.map((draft) => (
                  <AiDraftPreviewRow
                    key={draft.tempId}
                    draft={draft}
                    onChange={(next) =>
                      setDrafts((list) => list.map((d) => (d.tempId === draft.tempId ? next : d)))
                    }
                    onToggleSelect={(selected) =>
                      setDrafts((list) => toggleDraftSelection(list, draft.tempId, selected))
                    }
                  />
                ))}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ ...muDialogFooter, px: 2, py: 1.5, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {step > 0 && step < 3 ? (
            <Button
              sx={muFooterBtnOutlined}
              startIcon={<ArrowBackIcon />}
              disabled={processing || applying || loadingPreview}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Quay lại
            </Button>
          ) : (
            <Button sx={muFooterBtnOutlined} onClick={handleClose} disabled={processing || applying}>
              Hủy
            </Button>
          )}
          {step === 2 && !isMobile ? (
            <Typography sx={{ fontSize: 11, color: "#64748b" }}>✨ {AI_GEN_PROCESSING_TIP}</Typography>
          ) : null}
        </Box>
        <Box>
          {step === 0 ? (
            <Button
              sx={muFooterBtnPrimary}
              startIcon={loadingPreview ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
              disabled={loadingPreview}
              onClick={() => void goToPromptPreview()}
            >
              {loadingPreview ? "Đang tạo preview…" : "Tiếp theo — Xem prompt"}
            </Button>
          ) : null}
          {step === 1 ? (
            <Button sx={muFooterBtnPrimary} startIcon={<AutoAwesomeOutlinedIcon />} onClick={() => void startGeneration()}>
              Sinh bài tập
            </Button>
          ) : null}
          {step === 3 ? (
            <Button
              sx={muFooterBtnPrimary}
              startIcon={<PlaylistAddCheckOutlinedIcon />}
              disabled={selectedCount === 0 || applying}
              onClick={() => void handleApply()}
            >
              {applying
                ? "Đang lưu…"
                : applyMode === "replace"
                  ? `Áp dụng ${selectedCount} câu (thay bài hiện tại)`
                  : `Thêm ${selectedCount} câu vào bài tập`}
            </Button>
          ) : null}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
