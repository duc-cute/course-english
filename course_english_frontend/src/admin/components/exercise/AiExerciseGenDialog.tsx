import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";import { useCallback, useEffect, useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { draftsToExerciseQuestions } from "../../../shared/ai/questionGen/draftToExercise";
import {
  AI_GEN_QUESTION_TYPE_OPTIONS,
  aiDraftSummaryLine,
  type AiDraftQuestion,
  type AiGenQuestionType,
} from "../../../shared/ai/questionGen/types";
import {
  apiCreateQuestionGenTask,
  apiCreateTextAiDocument,
  apiGetAiTask,
  apiPatchAiTaskDraft,
  apiReportAiTaskPollTimeout,
  apiUploadAiDocument,
  type AiDocumentRecord,
} from "../../../shared/api/aiTask";
import type { AiDraftQuestion } from "../../../shared/ai/questionGen/types";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";

function draftTypeLabel(type: AiGenQuestionType | string): string {
  return AI_GEN_QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? String(type);
}

const STEPS = ["Nguồn nội dung", "Cấu hình", "Đang xử lý", "Xem trước"] as const;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const POLL_MS = 2000;
const POLL_MAX_MS = 180_000;
const MIN_PASTE_CHARS = 80;

type SourceMode = "file" | "paste";

type AiExerciseGenDialogProps = {
  open: boolean;
  onClose: () => void;
  onApplied: (questions: ExerciseQuestion[]) => void;
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

export function AiExerciseGenDialog({ open, onClose, onApplied }: AiExerciseGenDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollStartedRef = useRef(0);

  const [step, setStep] = useState(0);
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [document, setDocument] = useState<AiDocumentRecord | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState(2);
  const [promptLang, setPromptLang] = useState("en");
  const [questionTypes, setQuestionTypes] = useState<AiGenQuestionType[]>([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
  ]);
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStep(0);
    setSourceMode("file");
    setFile(null);
    setPastedText("");
    setPasteTitle("");
    setDocument(null);
    setQuestionCount(10);
    setDifficulty(2);
    setPromptLang("en");
    setQuestionTypes(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"]);
    setDrafts([]);
    setTaskId(null);
    setUploading(false);
    setProcessing(false);
    setApplying(false);
    setError("");
    pollStartedRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  const toggleType = (type: AiGenQuestionType) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSourceModeChange = (_: unknown, next: SourceMode | null) => {
    if (!next) return;
    setSourceMode(next);
    setDocument(null);
    setError("");
    if (next === "paste") {
      setQuestionTypes(["READING_COMPREHENSION"]);
      setQuestionCount(1);
    }
  };

  const handleFilePick = (picked: File | null) => {
    if (!picked) return;
    setFile(picked);
    setDocument(null);
    setError("");
  };

  const prepareDocument = async (): Promise<AiDocumentRecord | null> => {
    if (document?.id) return document;

    if (sourceMode === "paste") {
      const text = pastedText.trim();
      if (text.length < MIN_PASTE_CHARS) {
        setError(`Nội dung dán cần ít nhất ${MIN_PASTE_CHARS} ký tự.`);
        return null;
      }
      setUploading(true);
      setError("");
      try {
        const record = await apiCreateTextAiDocument({
          text,
          title: pasteTitle.trim() || undefined,
        });
        setDocument(record);
        return record;
      } catch (err) {
        setError((err as { message?: string })?.message ?? "Không lưu được nội dung dán.");
        return null;
      } finally {
        setUploading(false);
      }
    }

    if (!file) {
      setError("Vui lòng chọn file PDF hoặc DOCX.");
      return null;
    }
    setUploading(true);
    setError("");
    try {
      const record = await apiUploadAiDocument(file);
      setDocument(record);
      return record;
    } catch (err) {
      setError(
        (err as { message?: string })?.message ??
          "Không upload được tài liệu. API sinh câu hỏi đang được triển khai.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const startGeneration = async (doc: AiDocumentRecord) => {
    setProcessing(true);
    setError("");
    setStep(2);
    pollStartedRef.current = Date.now();
    try {
      const body = await apiCreateQuestionGenTask({
        documentId: doc.id,
        questionCount,
        questionTypes,
        difficulty,
        promptLang,
      });
      const id = body.taskId ?? (body as { id?: string }).id;
      if (!id) {
        throw new Error("Không nhận được taskId");
      }
      setTaskId(id);
    } catch (err) {
      setProcessing(false);
      setError(
        (err as { message?: string })?.message ??
          "Không tạo được tác vụ sinh câu. API đang được triển khai.",
      );
      setStep(1);
    }
  };

  useEffect(() => {
    if (!open || step !== 2 || !taskId || !processing) return;

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - pollStartedRef.current > POLL_MAX_MS) {
        setProcessing(false);
        setError("Xử lý quá lâu. Vui lòng thử lại sau.");
        setStep(1);
        if (taskId) {
          void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
        }
        return;
      }
      try {
        const task = await apiGetAiTask(taskId);
        const status = task.status;
        if (status === "DONE") {
          const questions = task.outputJson?.questions ?? [];
          setDrafts(normalizeDrafts(questions));
          setProcessing(false);
          setStep(3);
          return;
        }
        if (status === "FAILED") {
          setProcessing(false);
          setError(task.errorMessage ?? "Sinh câu hỏi thất bại.");
          setStep(1);
          return;
        }
      } catch (err) {
        setProcessing(false);
        setError((err as { message?: string })?.message ?? "Không lấy được trạng thái tác vụ.");
        setStep(1);
        return;
      }
      if (!cancelled) {
        window.setTimeout(() => void poll(), POLL_MS);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [open, step, taskId, processing]);

  const handleNextFromSource = async () => {
    const doc = await prepareDocument();
    if (!doc) return;
    setStep(1);
  };

  const handleNextFromConfig = async () => {
    if (questionTypes.length === 0) {
      setError("Chọn ít nhất một loại câu hỏi.");
      return;
    }
    if (questionCount < 1 || questionCount > 50) {
      setError("Số câu hỏi từ 1 đến 50.");
      return;
    }
    const doc = document ?? (await prepareDocument());
    if (!doc) return;
    await startGeneration(doc);
  };

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
        setError("Chọn ít nhất một câu hợp lệ để thêm vào bài tập.");
        return;
      }
      onApplied(next);
      handleClose();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không lưu được bản nháp.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { ...muDialogPaper, minHeight: 420 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon fontSize="small" color="primary" />
        Sinh câu hỏi bằng AI
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 2, mt: 0.5 }}>
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
          <Box>
            <Tabs
              value={sourceMode}
              onChange={handleSourceModeChange}
              sx={{ mb: 1.5, minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: 12, py: 0 } }}
            >
              <Tab icon={<UploadFileOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Upload file" value="file" />
              <Tab
                icon={<ContentPasteOutlinedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Dán nội dung"
                value="paste"
              />
            </Tabs>

            {sourceMode === "file" ? (
              <>
                <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1.5 }}>
                  Upload PDF hoặc DOCX — AI đọc nội dung và sinh câu hỏi.
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  hidden
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileOutlinedIcon />}
                  sx={muFooterBtnOutlined}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {file ? `Đã chọn: ${file.name}` : "Chọn file PDF / DOCX"}
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1 }}>
                  Dán đoạn đọc hiểu (và câu hỏi có sẵn nếu có). Phù hợp khi đoạn ngắn, không cần upload file.
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  sx={{ ...muTextFieldSx, mb: 1 }}
                  label="Tiêu đề (tuỳ chọn)"
                  placeholder="READING COMPREHENSION"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                />
                <TextField
                  multiline
                  minRows={8}
                  maxRows={16}
                  fullWidth
                  sx={muTextFieldSx}
                  placeholder="Dán đoạn văn + câu hỏi A/B/C/D (nếu có)..."
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setDocument(null);
                  }}
                  helperText={`${pastedText.trim().length} ký tự — tối thiểu ${MIN_PASTE_CHARS}`}
                />
              </>
            )}

            {document ? (
              <Typography sx={{ fontSize: 11, color: "#888780", mt: 1 }}>
                Nguồn: {document.fileName}
                {document.pageCount ? ` — ${document.pageCount} trang` : ""}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {step === 1 ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box>
              <Typography sx={muFieldLabel}>Loại câu hỏi</Typography>
              <FormGroup row>
                {AI_GEN_QUESTION_TYPE_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={questionTypes.includes(opt.value)}
                        onChange={() => toggleType(opt.value)}
                      />
                    }
                    label={<Typography fontSize={12}>{opt.label}</Typography>}
                  />
                ))}
              </FormGroup>
              {questionTypes.includes("READING_COMPREHENSION") ? (
                <Typography sx={{ fontSize: 11, color: "#888780", mt: 0.5 }}>
                  Đọc hiểu: mỗi item = 1 đoạn văn + nhiều câu con. Nên đặt số câu = 1–2 và chỉ tick Đọc hiểu.
                </Typography>
              ) : null}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
              <Box>
                <Typography sx={muFieldLabel}>Số câu (1–50)</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  sx={muTextFieldSx}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Box>
              <Box>
                <Typography sx={muFieldLabel}>Độ khó (1–5)</Typography>
                <TextField
                  select
                  size="small"
                  fullWidth
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
              <Box>
                <Typography sx={muFieldLabel}>Ngôn ngữ stem</Typography>
                <TextField
                  select
                  size="small"
                  fullWidth
                  sx={muTextFieldSx}
                  value={promptLang}
                  onChange={(e) => setPromptLang(e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="vi">Tiếng Việt</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Box>
        ) : null}

        {step === 2 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 1.5 }}>
            <CircularProgress size={36} />
            <Typography sx={{ fontSize: 13, color: "#5F5E5A" }}>
              Đang đọc tài liệu và sinh câu hỏi…
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#888780" }}>
              Có thể mất 30–90 giây tùy độ dài file.
            </Typography>
          </Box>
        ) : null}

        {step === 3 ? (
          <Box>
            <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1 }}>
              Chọn câu muốn thêm vào bài tập. Có thể chỉnh sửa chi tiết sau khi thêm.
            </Typography>
            {drafts.length === 0 ? (
              <Typography sx={{ fontSize: 12, fontStyle: "italic", color: "#888780" }}>
                Không có câu hỏi nào được sinh.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 0.75, maxHeight: 320, overflow: "auto" }}>
                {drafts.map((draft) => {
                  const hasErrors = (draft.validationErrors?.length ?? 0) > 0;
                  return (
                    <Box
                      key={draft.tempId}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        p: 1,
                        border: "1px solid #ECEAE3",
                        borderRadius: "8px",
                        bgcolor: hasErrors ? "rgba(186,26,26,0.04)" : "#fff",
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={draft.selected}
                        disabled={hasErrors}
                        onChange={(e) =>
                          setDrafts((list) => toggleDraftSelection(list, draft.tempId, e.target.checked))
                        }
                        sx={{ mt: -0.25 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
                          <Chip
                            size="small"
                            label={draftTypeLabel(draft.questionType)}
                            sx={{ height: 20, fontSize: 10 }}
                          />
                          {hasErrors
                            ? draft.validationErrors!.map((msg) => (
                                <Chip key={msg} size="small" color="error" label={msg} sx={{ height: 20, fontSize: 10 }} />
                              ))
                            : null}
                        </Box>
                        <Typography sx={{ fontSize: 12, lineHeight: 1.4 }} noWrap title={aiDraftSummaryLine(draft)}>
                          {aiDraftSummaryLine(draft)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} onClick={handleClose} disabled={uploading || processing || applying}>
          Hủy
        </Button>
        {step > 0 && step < 3 ? (
          <Button
            sx={muFooterBtnOutlined}
            disabled={uploading || processing || applying}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Quay lại
          </Button>
        ) : null}
        {step === 0 ? (
          <Button
            sx={muFooterBtnPrimary}
            disabled={
              uploading ||
              (sourceMode === "file" ? !file : pastedText.trim().length < MIN_PASTE_CHARS)
            }
            onClick={() => void handleNextFromSource()}
          >
            {uploading ? "Đang lưu…" : "Tiếp theo"}
          </Button>
        ) : null}
        {step === 1 ? (
          <Button sx={muFooterBtnPrimary} onClick={() => void handleNextFromConfig()}>
            Sinh câu hỏi
          </Button>
        ) : null}
        {step === 3 ? (
          <Button sx={muFooterBtnPrimary} disabled={selectedCount === 0 || applying} onClick={() => void handleApply()}>
            {applying ? "Đang lưu…" : `Thêm ${selectedCount} câu vào bài tập`}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
