import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
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
  apiCreateTextAiDocument,
  apiGetAiTask,
  apiPatchAiTaskDraft,
  apiReportAiTaskPollTimeout,
  apiUploadAiDocument,
  type AiDocumentRecord,
} from "../../../shared/api/aiTask";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { AiDraftPreviewRow } from "./AiDraftPreviewRow";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "./AiGenProcessingPanel";

type SourceMode = "file" | "paste";

const STEPS = ["Nguồn nội dung", "Cấu hình", "Đang xử lý", "Xem trước"] as const;
const STEPS_SHORT = ["Nguồn", "Cấu hình", "Xử lý", "Xem"] as const;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIN_PASTE_CHARS = 80;

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
  const [pollElapsedSec, setPollElapsedSec] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [genSummaryMessage, setGenSummaryMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFilePick(droppedFile);
    }
  };

  const applyTaskProgress = (task: { progressMessage?: string | null; progressPercent?: number | null }) => {
    if (task.progressMessage) {
      setProgressMessage(task.progressMessage);
    }
    if (typeof task.progressPercent === "number" && !Number.isNaN(task.progressPercent)) {
      setProgressPercent((prev) =>
        prev === null ? task.progressPercent! : Math.max(prev, task.progressPercent!),
      );
    }
  };

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
    setPollElapsedSec(0);
    setProgressMessage("");
    setProgressPercent(null);
    setGenSummaryMessage("");
    pollStartedRef.current = 0;
    setIsDragOver(false);
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
    setError("");
    setProgressMessage("Đang khởi tạo tác vụ AI…");
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
        setError(
          "Xử lý quá lâu trên trình duyệt. Tác vụ có thể vẫn đang chạy trên máy chủ — thử lại sau hoặc giảm số câu.",
        );
        setStep(1);
        if (taskId) {
          void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
        }
        return;
      }
      try {
        const task = await apiGetAiTask(taskId);
        applyTaskProgress(task);
        const status = task.status;
        if (status === "DONE") {
          applyTaskProgress({ progressMessage: "Hoàn thành", progressPercent: 100 });
          const questions = task.outputJson?.questions ?? [];
          setDrafts(normalizeDrafts(questions));
          setGenSummaryMessage(task.outputJson?.meta?.summaryMessage ?? "");
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
        // Server may reject a duplicate async dispatch while the original worker is still running.
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((r) => window.setTimeout(r, 2000));
          if (cancelled) return;
          try {
            const retryTask = await apiGetAiTask(taskId);
            applyTaskProgress(retryTask);
            if (retryTask.status === "DONE") {
              const questions = retryTask.outputJson?.questions ?? [];
              setDrafts(normalizeDrafts(questions));
              setGenSummaryMessage(retryTask.outputJson?.meta?.summaryMessage ?? "");
              setProcessing(false);
              setStep(3);
              return;
            }
            if (retryTask.status === "FAILED") {
              setProcessing(false);
              setError(retryTask.errorMessage ?? "Sinh câu hỏi thất bại.");
              setStep(1);
              return;
            }
            if (!cancelled) {
              window.setTimeout(() => void poll(), AI_TASK_POLL_INTERVAL_MS);
            }
            return;
          } catch {
            /* keep retrying */
          }
        }
        setProcessing(false);
        setError((err as { message?: string })?.message ?? "Không lấy được trạng thái tác vụ.");
        setStep(1);
        return;
      }
      if (!cancelled) {
        window.setTimeout(() => void poll(), AI_TASK_POLL_INTERVAL_MS);
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
    setStep(2);
    setProcessing(true);
    setProgressPercent(null);
    setProgressMessage(document?.id ? "Đang khởi tạo…" : "Đang upload và đọc PDF…");
    pollStartedRef.current = Date.now();
    const doc = document ?? (await prepareDocument());
    if (!doc) {
      setProcessing(false);
      setStep(1);
      return;
    }
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
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      className={`ai-gen-dialog${isMobile ? " ai-gen-dialog--mobile" : ""}`}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          minHeight: isMobile ? "100%" : step === 2 ? 580 : 420,
          maxWidth: isMobile ? "100%" : "1000px",
          borderRadius: isMobile ? 0 : undefined,
        },
      }}
    >
      <DialogTitle className="ai-gen-dialog__title" sx={{ pb: 0, pr: 6, position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
          <span className="ai-gen-dialog__title-text">
            {isMobile ? "Sinh câu AI" : "Sinh câu hỏi bằng AI"}
          </span>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: (theme) => theme.palette.grey[500],
          }}
          disabled={uploading || processing || applying}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {step < 3 ? (
          <div className="ai-gen-processing">
            <AiGenProcessingDecorations />

            <Stepper
              activeStep={step}
              alternativeLabel={!isMobile}
              className="ai-gen-stepper"
              sx={{ mb: 2, mt: 0.5 }}
            >
              {STEPS.map((label, i) => (
                <Step key={label}>
                  <StepLabel className="ai-gen-stepper__label">
                    {isMobile ? STEPS_SHORT[i] : label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error ? (
              <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }} onClose={() => setError("")}>
                {error}
              </Alert>
            ) : null}

            {step === 0 ? (
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Pill-shaped Tab Switcher */}
                <div className={`ai-gen-pill-switcher${isMobile ? " ai-gen-pill-switcher--compact" : ""}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode("file");
                      setDocument(null);
                      setError("");
                    }}
                    className={`ai-gen-pill-btn ${
                      sourceMode === "file"
                        ? "ai-gen-pill-btn--active"
                        : "ai-gen-pill-btn--inactive"
                    }`}
                    aria-label="Chọn file upload"
                  >
                    <UploadFileOutlinedIcon className="ai-gen-pill-btn__icon" />
                    <span className="ai-gen-pill-btn__text">{isMobile ? "File" : "Chọn file upload"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode("paste");
                      setDocument(null);
                      setError("");
                      setQuestionTypes(["READING_COMPREHENSION"]);
                      setQuestionCount(1);
                    }}
                    className={`ai-gen-pill-btn ${
                      sourceMode === "paste"
                        ? "ai-gen-pill-btn--active"
                        : "ai-gen-pill-btn--inactive"
                    }`}
                    aria-label="Dán nội dung"
                  >
                    <ContentPasteOutlinedIcon className="ai-gen-pill-btn__icon" />
                    <span className="ai-gen-pill-btn__text">{isMobile ? "Dán" : "Dán nội dung"}</span>
                  </button>
                </div>

                {sourceMode === "file" ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`ai-gen-dropzone ${isDragOver ? "ai-gen-dropzone--dragover" : ""}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT}
                      hidden
                      onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                    />
                    <div className="ai-gen-dropzone__icon-wrapper">
                      <svg
                        className="ai-gen-dropzone__icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>

                    <p className="ai-gen-dropzone__primary-text">
                      {file ? `Đã chọn: ${file.name}` : "Kéo thả file PDF hoặc DOCX vào đây"}
                    </p>
                    <p className="ai-gen-dropzone__sub-text">Tối đa 10MB</p>

                    <button type="button" className="ai-gen-dropzone__btn">
                      Chọn file
                    </button>
                  </div>
                ) : (
                  <div className="ai-gen-paste-container">
                    <div className="ai-gen-paste-field-group">
                      <label className="ai-gen-paste-label">Tiêu đề (tuỳ chọn)</label>
                      <input
                        type="text"
                        placeholder="READING COMPREHENSION"
                        value={pasteTitle}
                        onChange={(e) => setPasteTitle(e.target.value)}
                        className="ai-gen-paste-input"
                      />
                    </div>
                    <div className="ai-gen-paste-field-group">
                      <label className="ai-gen-paste-label">Nội dung văn bản</label>
                      <textarea
                        rows={4}
                        placeholder="Dán đoạn văn + câu hỏi A/B/C/D (nếu có)..."
                        value={pastedText}
                        onChange={(e) => {
                          setPastedText(e.target.value);
                          setDocument(null);
                        }}
                        className="ai-gen-paste-textarea"
                      />
                      <span className="ai-gen-paste-helper">
                        {pastedText.trim().length} ký tự — tối thiểu {MIN_PASTE_CHARS}
                      </span>
                    </div>
                  </div>
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
              <AiGenProcessingPanel
                progressMessage={progressMessage}
                progressPercent={progressPercent}
                elapsedSec={pollElapsedSec}
                active={processing}
              />
            ) : null}

            {step === 2 ? (
              <AiGenFunFactsPanel active={open && step === 2} />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <Box sx={{ p: 2.5 }}>
            <Stepper
              activeStep={step}
              alternativeLabel={!isMobile}
              className="ai-gen-stepper"
              sx={{ mb: 2, mt: 0.5 }}
            >
              {STEPS.map((label, i) => (
                <Step key={label}>
                  <StepLabel className="ai-gen-stepper__label">
                    {isMobile ? STEPS_SHORT[i] : label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error ? (
              <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }} onClose={() => setError("")}>
                {error}
              </Alert>
            ) : null}

            {genSummaryMessage ? (
              <Alert severity="info" sx={{ mb: 1.5, fontSize: 12 }}>
                {genSummaryMessage}
              </Alert>
            ) : null}
            <Typography sx={{ fontSize: 12, color: "#5F5E5A", mb: 1 }}>
              Chọn câu muốn thêm vào bài tập. Bấm mũi tên để sửa stem / đáp án trước khi thêm.
            </Typography>
            {drafts.length === 0 ? (
              <Typography sx={{ fontSize: 12, fontStyle: "italic", color: "#888780" }}>
                Không có câu hỏi nào được sinh.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 0.75, maxHeight: 360, overflow: "auto" }}>
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

      <DialogActions
        className="ai-gen-dialog__footer"
        sx={{
          ...muDialogFooter,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: isMobile ? 1 : 0,
          px: isMobile ? 1.5 : undefined,
          py: isMobile ? 1.25 : undefined,
        }}
      >
        <Box
          className="ai-gen-dialog__footer-actions"
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {isMobile ? (
              <Tooltip title="Hủy" arrow>
                <span>
                  <IconButton
                    onClick={handleClose}
                    disabled={uploading || processing || applying}
                    aria-label="Hủy"
                    size="small"
                    sx={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Button sx={muFooterBtnOutlined} onClick={handleClose} disabled={uploading || processing || applying}>
                Hủy
              </Button>
            )}

            {!isMobile && step === 2 ? (
              <Typography className="ai-gen-dialog__footer-tip" sx={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                ✨ Mẹo: {AI_GEN_PROCESSING_TIP}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {step > 0 && step < 3 ? (
            isMobile ? (
              <Tooltip title="Quay lại" arrow>
                <span>
                  <IconButton
                    disabled={uploading || processing || applying}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    aria-label="Quay lại"
                    size="small"
                    sx={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Button
                sx={muFooterBtnOutlined}
                disabled={uploading || processing || applying}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Quay lại
              </Button>
            )
          ) : null}
          {step === 0 ? (
            isMobile ? (
              <Tooltip title={uploading ? "Đang lưu…" : "Tiếp theo"} arrow>
                <span>
                  <IconButton
                    sx={{
                      ...muFooterBtnPrimary,
                      borderRadius: "8px",
                      width: 40,
                      height: 40,
                    }}
                    disabled={
                      uploading ||
                      (sourceMode === "file" ? !file : pastedText.trim().length < MIN_PASTE_CHARS)
                    }
                    onClick={() => void handleNextFromSource()}
                    aria-label={uploading ? "Đang lưu" : "Tiếp theo"}
                  >
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
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
            )
          ) : null}
          {step === 1 ? (
            isMobile ? (
              <Tooltip title="Sinh câu hỏi" arrow>
                <span>
                  <IconButton
                    className="ai-gen-footer-ai-btn ai-gen-footer-ai-btn--icon"
                    onClick={() => void handleNextFromConfig()}
                    aria-label="Sinh câu hỏi"
                    sx={{ width: 40, height: 40, borderRadius: "8px" }}
                  >
                    <AutoAwesomeOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Button sx={muFooterBtnPrimary} onClick={() => void handleNextFromConfig()}>
                Sinh câu hỏi
              </Button>
            )
          ) : null}
          {step === 3 ? (
            isMobile ? (
              <Tooltip title={applying ? "Đang lưu…" : `Thêm ${selectedCount} câu`} arrow>
                <span>
                  <IconButton
                    sx={{
                      ...muFooterBtnPrimary,
                      borderRadius: "8px",
                      width: 40,
                      height: 40,
                    }}
                    disabled={selectedCount === 0 || applying}
                    onClick={() => void handleApply()}
                    aria-label={applying ? "Đang lưu" : `Thêm ${selectedCount} câu vào bài tập`}
                  >
                    <PlaylistAddCheckOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Button sx={muFooterBtnPrimary} disabled={selectedCount === 0 || applying} onClick={() => void handleApply()}>
                {applying ? "Đang lưu…" : `Thêm ${selectedCount} câu vào bài tập`}
              </Button>
            )
          ) : null}
          </Box>
        </Box>

        {isMobile && step === 2 ? (
          <Typography
            className="ai-gen-dialog__footer-tip ai-gen-dialog__footer-tip--mobile"
            sx={{ fontSize: 11, color: "#64748b", textAlign: "center", width: "100%", px: 0.5, lineHeight: 1.45 }}
          >
            ✨ {AI_GEN_PROCESSING_TIP}
          </Typography>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
