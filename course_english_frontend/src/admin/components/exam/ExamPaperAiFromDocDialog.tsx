import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import {
  AI_EXAM_PAPER_POLL_MAX_MS,
  AI_EXAM_PAPER_PROCESSING_HINT,
  AI_TASK_POLL_INTERVAL_MS,
} from "../../../shared/ai/questionGen/aiTaskPolling";
import { draftsToExerciseQuestions } from "../../../shared/ai/questionGen/draftToExercise";
import {
  AI_GEN_QUESTION_TYPE_OPTIONS,
  type AiGenQuestionType,
} from "../../../shared/ai/questionGen/types";
import {
  apiCreateExamPaperGenTask,
  apiGetAiTask,
  apiReportAiTaskPollTimeout,
  apiUploadAiDocument,
  type AiDocumentRecord,
  type AiExamPaperGenEnvelope,
  type ExamPaperOutline,
  type ExamSectionGenSpec,
} from "../../../shared/api/aiTask";
import { apiExamPaperOutline, apiExamSectionSlices } from "../../../shared/api/examPaper";
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "../exercise/AiGenProcessingPanel";
import type { ExamPaperImportApplied } from "./ExamPaperImportDialog";

const STEPS = ["Nguồn", "Outline", "Đang sinh", "Áp dụng"] as const;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ExamPaperAiFromDocDialogProps = {
  open: boolean;
  onClose: () => void;
  newClientKey: () => string;
  onApplied: (result: ExamPaperImportApplied) => void;
};

function sumSectionQuestions(specs: ExamSectionGenSpec[]): number {
  return specs.reduce((sum, s) => sum + (s.questionCount ?? 0), 0);
}

function sliceStatusLabel(spec: ExamSectionGenSpec): string {
  if (spec.useFullDocument) {
    return "Toàn bộ đề (bạn chọn)";
  }
  if (spec.sliceMode === "SLICED") {
    const range =
      spec.excerptStart != null && spec.excerptEnd != null
        ? ` · ký tự ${spec.excerptStart.toLocaleString()}–${spec.excerptEnd.toLocaleString()}`
        : "";
    return `Cắt theo PART (${spec.sliceConfidence ?? "MEDIUM"})${range}`;
  }
  return "Toàn bộ đề (không cắt được PART)";
}

function sliceChipColor(
  spec: ExamSectionGenSpec,
): "default" | "success" | "warning" | "error" {
  if (spec.useFullDocument || spec.sliceMode === "FULL") {
    return "warning";
  }
  if (spec.sliceConfidence === "HIGH") {
    return "success";
  }
  if (spec.sliceConfidence === "MEDIUM") {
    return "warning";
  }
  return "default";
}

function excerptPreviewCaption(spec: ExamSectionGenSpec): string {
  if (spec.useFullDocument) {
    return "Preview: 480 ký tự đầu của TOÀN BỘ đề (bạn chọn không cắt PART). Mọi phần đều giống nhau.";
  }
  if (spec.sliceMode === "SLICED") {
    const range =
      spec.excerptStart != null && spec.excerptEnd != null
        ? ` (ký tự ${spec.excerptStart.toLocaleString()}–${spec.excerptEnd.toLocaleString()})`
        : "";
    return `Preview: đoạn text CHỈ thuộc PART này sẽ gửi AI${range}. Mỗi phần khác nhau.`;
  }
  return "Preview: 480 ký tự đầu của TOÀN BỘ đề — chưa cắt được PART nên mọi phần giống nhau.";
}

export function ExamPaperAiFromDocDialog({
  open,
  onClose,
  newClientKey,
  onApplied,
}: ExamPaperAiFromDocDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollStartedRef = useRef(0);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<AiDocumentRecord | null>(null);
  const [outline, setOutline] = useState<ExamPaperOutline | null>(null);
  const [sectionSpecs, setSectionSpecs] = useState<ExamSectionGenSpec[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [paperInstruction, setPaperInstruction] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [promptLang, setPromptLang] = useState("en");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<AiExamPaperGenEnvelope | null>(null);
  const [uploading, setUploading] = useState(false);
  const [outlining, setOutlining] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [pollElapsedSec, setPollElapsedSec] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [recalculatingSlices, setRecalculatingSlices] = useState(false);
  const [sliceWarnings, setSliceWarnings] = useState<string[]>([]);
  const [expandedPreviewIndex, setExpandedPreviewIndex] = useState<number | null>(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilePick = (picked: File | null) => {
    setFile(picked);
    setDocument(null);
    setError("");
  };

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

  const resetState = useCallback(() => {
    setStep(0);
    setFile(null);
    setDocument(null);
    setOutline(null);
    setSectionSpecs([]);
    setExamTitle("");
    setPaperInstruction("");
    setTaskId(null);
    setEnvelope(null);
    setUploading(false);
    setOutlining(false);
    setProcessing(false);
    setApplying(false);
    setError("");
    setPollElapsedSec(0);
    setProgressMessage("");
    setProgressPercent(null);
    setRecalculatingSlices(false);
    setSliceWarnings([]);
    setExpandedPreviewIndex(0);
    pollStartedRef.current = 0;
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  const handleClose = () => {
    if (uploading || outlining || processing || applying) return;
    onClose();
  };

  const prepareDocument = async (): Promise<AiDocumentRecord | null> => {
    if (document?.id) return document;

    if (!file) {
      setError("Chọn file PDF hoặc DOCX.");
      return null;
    }
    setUploading(true);
    try {
      const record = await apiUploadAiDocument(file);
      setDocument(record);
      return record;
    } catch (err) {
      setError((err as Error)?.message ?? "Không upload được tài liệu.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const runOutline = async () => {
    setError("");
    setOutlining(true);
    try {
      const doc = await prepareDocument();
      if (!doc?.id) return;
      const result = await apiExamPaperOutline(doc.id);
      setOutline(result);
      setExamTitle(result.examTitle ?? "");
      setPaperInstruction(result.paperInstruction ?? "");
      setSectionSpecs(result.sections ?? []);
      setSliceWarnings(result.warnings ?? []);
      setStep(1);
    } catch (err) {
      setError((err as Error)?.message ?? "Không phân tích được outline.");
    } finally {
      setOutlining(false);
    }
  };

  const applyTaskProgress = (task: {
    progressMessage?: string | null;
    progressPercent?: number | null;
  }) => {
    if (task.progressMessage) {
      setProgressMessage(task.progressMessage);
    }
    if (typeof task.progressPercent === "number" && !Number.isNaN(task.progressPercent)) {
      setProgressPercent((prev) =>
        prev === null ? task.progressPercent! : Math.max(prev, task.progressPercent!),
      );
    }
  };

  const startGeneration = async () => {
    if (!document?.id || sectionSpecs.length === 0) {
      setError("Cần ít nhất một section trong outline.");
      return;
    }
    setError("");
    setProcessing(true);
    setStep(2);
    setPollElapsedSec(0);
    setProgressPercent(null);
    pollStartedRef.current = Date.now();
    setProgressMessage("Đang khởi tạo tác vụ sinh đề…");
    try {
      const body = await apiCreateExamPaperGenTask({
        documentId: document.id,
        sectionSpecs,
        examTitle: examTitle.trim() || undefined,
        paperInstruction: paperInstruction.trim() || undefined,
        difficulty,
        promptLang,
      });
      const id = body.taskId ?? (body as { id?: string }).id;
      if (!id) throw new Error("Không nhận được taskId");
      setTaskId(id);
    } catch (err) {
      setProcessing(false);
      setStep(1);
      setError((err as Error)?.message ?? "Không tạo được tác vụ AI.");
    }
  };

  useEffect(() => {
    if (!processing) return undefined;
    const startedAt = pollStartedRef.current || Date.now();
    pollStartedRef.current = startedAt;
    const elapsedTimer = window.setInterval(() => {
      setPollElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(elapsedTimer);
  }, [processing]);

  useEffect(() => {
    if (!taskId || !processing) return undefined;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      const elapsed = Date.now() - pollStartedRef.current;
      if (elapsed > AI_EXAM_PAPER_POLL_MAX_MS) {
        setProcessing(false);
        setError("Xử lý quá lâu (tối đa ~10 phút) — thử lại sau hoặc giảm số phần/câu.");
        void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
        setStep(1);
        return;
      }
      try {
        const task = await apiGetAiTask(taskId);
        applyTaskProgress(task);
        if (task.status === "DONE") {
          applyTaskProgress({ progressMessage: "Hoàn thành", progressPercent: 100 });
          const output = task.outputJson as AiExamPaperGenEnvelope | undefined;
          setEnvelope(output ?? null);
          setProcessing(false);
          setStep(3);
          return;
        }
        if (task.status === "FAILED") {
          setProcessing(false);
          setError(task.errorMessage ?? "Sinh đề thất bại.");
          setStep(1);
          return;
        }
      } catch {
        /* retry */
      }
      if (!cancelled) {
        window.setTimeout(poll, AI_TASK_POLL_INTERVAL_MS);
      }
    };

    const timer = window.setTimeout(poll, AI_TASK_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [taskId, processing]);

  const handleApply = () => {
    if (!envelope?.sections?.length) {
      setError("Không có section để áp dụng.");
      return;
    }
    setApplying(true);
    try {
      const sections = envelope.sections.map((section) => {
        const questions = draftsToExerciseQuestions(section.questions ?? []);
        const payloadJson = buildExerciseSetPayloadJson({
          title: section.title,
          instruction: section.instruction,
          questions,
        });
        return {
          clientKey: newClientKey(),
          title: section.title,
          instruction: section.instruction,
          questionType: section.questionType,
          payloadJson,
        };
      });
      onApplied({
        examTitle: envelope.examTitle ?? examTitle,
        paperInstruction: envelope.paperInstruction ?? paperInstruction,
        updatePaperMeta: true,
        sections,
      });
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const updateSpec = (index: number, patch: Partial<ExamSectionGenSpec>) => {
    setSectionSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const recalcSectionSlices = async () => {
    if (!document?.id || sectionSpecs.length === 0) {
      return;
    }
    setError("");
    setRecalculatingSlices(true);
    try {
      const result = await apiExamSectionSlices(document.id, sectionSpecs);
      setSectionSpecs(result.sections ?? []);
      setSliceWarnings(result.warnings ?? []);
    } catch (err) {
      setError((err as Error)?.message ?? "Không tính lại được vùng excerpt.");
    } finally {
      setRecalculatingSlices(false);
    }
  };

  const mergedOutlineWarnings = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const w of [...(outline?.warnings ?? []), ...sliceWarnings]) {
      if (!seen.has(w)) {
        seen.add(w);
        items.push(w);
      }
    }
    return items;
  }, [outline?.warnings, sliceWarnings]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      className={`ai-gen-dialog ai-gen-dialog--exam-paper${isMobile ? " ai-gen-dialog--mobile" : ""}`}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          minHeight: isMobile ? "100%" : step === 2 ? 580 : undefined,
          maxWidth: isMobile ? "100%" : "920px",
        },
      }}
    >
      <DialogTitle className="ai-gen-dialog__title" sx={{ pr: 6, position: "relative" }}>
        <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
        <span className="ai-gen-dialog__title-text">AI — Sinh đề từ Word/PDF</span>
        <IconButton
          aria-label="Đóng"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          disabled={uploading || outlining || processing || applying}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: isMobile ? 1.5 : 2.5 }}>
        <Stepper activeStep={step} alternativeLabel={!isMobile} sx={{ mb: 2 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {mergedOutlineWarnings.length ? (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            onClose={() => {
              setSliceWarnings([]);
              setOutline((prev) => (prev ? { ...prev, warnings: [] } : prev));
            }}
          >
            {mergedOutlineWarnings.map((w) => (
              <Typography key={w} variant="body2">
                {w}
              </Typography>
            ))}
          </Alert>
        ) : null}

        {step === 0 ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: "#5F5E5A" }}>
              Upload đề mẫu Word/PDF. AI sẽ phân tích cấu trúc phần I/II/III trước khi sinh câu.
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`ai-gen-dropzone${isDragOver ? " ai-gen-dropzone--dragover" : ""}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
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
            {document ? (
              <Typography sx={{ fontSize: 11, color: "#888780" }}>
                Nguồn: {document.fileName}
                {document.pageCount ? ` — ${document.pageCount} trang` : ""}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {step === 1 ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Tên đề"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              sx={muTextFieldSx}
            />
            <TextField
              label="Hướng dẫn chung (đề)"
              multiline
              minRows={2}
              value={paperInstruction}
              onChange={(e) => setPaperInstruction(e.target.value)}
              sx={muTextFieldSx}
            />
            <Typography sx={muFieldLabel}>
              Các phần ({sectionSpecs.length}) — tổng {sumSectionQuestions(sectionSpecs)} câu
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Xem trước đoạn text gửi AI cho từng PART. Nếu sai ranh giới, bật &quot;Dùng toàn bộ đề&quot; hoặc
                sửa tiêu đề PART rồi tính lại.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={recalculatingSlices ? <CircularProgress size={14} /> : <RefreshOutlinedIcon />}
                onClick={() => void recalcSectionSlices()}
                disabled={recalculatingSlices || !document?.id}
              >
                Tính lại vùng excerpt
              </Button>
            </Box>
            {sectionSpecs.map((spec, index) => (
              <Box
                key={`spec-${index}`}
                sx={{ p: 1.5, border: "1px solid #ECEAE3", borderRadius: 1, display: "grid", gap: 1 }}
              >
                <TextField
                  label="Tiêu đề phần"
                  size="small"
                  value={spec.title ?? ""}
                  onChange={(e) => updateSpec(index, { title: e.target.value })}
                  sx={muTextFieldSx}
                />
                <TextField
                  label="Instruction"
                  size="small"
                  multiline
                  minRows={2}
                  value={spec.instruction ?? ""}
                  onChange={(e) => updateSpec(index, { instruction: e.target.value })}
                  sx={muTextFieldSx}
                />
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    select
                    label="Loại câu"
                    size="small"
                    value={spec.questionType}
                    onChange={(e) =>
                      updateSpec(index, { questionType: e.target.value as AiGenQuestionType })
                    }
                    sx={{ ...muTextFieldSx, minWidth: 200 }}
                  >
                    {AI_GEN_QUESTION_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={
                      spec.questionType === "READING_COMPREHENSION"
                        ? "Số câu con (1 đoạn)"
                        : spec.questionType === "GAP_FILL_MCQ"
                          ? "Số ô trống (1 đoạn)"
                          : "Số câu"
                    }
                    type="number"
                    size="small"
                    value={spec.questionCount}
                    onChange={(e) => {
                      const raw = Math.max(1, Number(e.target.value) || 1);
                      let count = raw;
                      if (spec.questionType === "READING_COMPREHENSION") {
                        count = Math.min(12, raw);
                      } else if (spec.questionType === "GAP_FILL_MCQ") {
                        count = Math.min(12, Math.max(2, raw));
                      }
                      updateSpec(index, { questionCount: count });
                    }}
                    inputProps={
                      spec.questionType === "READING_COMPREHENSION"
                        ? { min: 2, max: 12 }
                        : spec.questionType === "GAP_FILL_MCQ"
                          ? { min: 2, max: 12 }
                          : { min: 1, max: 50 }
                    }
                    sx={{ ...muTextFieldSx, width: 140 }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip
                    size="small"
                    label={sliceStatusLabel(spec)}
                    color={sliceChipColor(spec)}
                    variant="outlined"
                  />
                  {spec.sliceMarkerLabel ? (
                    <Typography variant="caption" color="text.secondary">
                      Marker: PART {spec.sliceMarkerLabel}
                    </Typography>
                  ) : null}
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(spec.useFullDocument)}
                      onChange={(e) => updateSpec(index, { useFullDocument: e.target.checked })}
                    />
                  }
                  label={
                    <Typography variant="body2">Dùng toàn bộ đề cho phần này (không cắt PART)</Typography>
                  }
                />
                {spec.excerptPreview ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      {excerptPreviewCaption(spec)}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() =>
                        setExpandedPreviewIndex((prev) => (prev === index ? null : index))
                      }
                      sx={{ textTransform: "none", px: 0, minWidth: 0 }}
                    >
                      {expandedPreviewIndex === index ? "Ẩn preview excerpt" : "Xem preview excerpt gửi AI"}
                    </Button>
                    <Collapse in={expandedPreviewIndex === index}>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          mt: 0.5,
                          p: 1.25,
                          maxHeight: 200,
                          overflow: "auto",
                          fontSize: 11,
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          bgcolor: "#FAFAF8",
                          border: "1px solid #ECEAE3",
                          borderRadius: 1,
                          color: "#3D3C38",
                        }}
                      >
                        {spec.excerptPreview}
                      </Box>
                    </Collapse>
                  </Box>
                ) : null}
              </Box>
            ))}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                select
                label="Độ khó"
                size="small"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                sx={{ ...muTextFieldSx, width: 120 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Ngôn ngữ câu hỏi"
                size="small"
                value={promptLang}
                onChange={(e) => setPromptLang(e.target.value)}
                sx={{ ...muTextFieldSx, width: 120 }}
              />
            </Box>
          </Box>
        ) : null}

        {step === 2 ? (
          <Box className="ai-gen-processing ai-gen-processing--exam-paper" sx={{ position: "relative", minHeight: 360 }}>
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              progressMessage={progressMessage}
              progressPercent={progressPercent}
              elapsedSec={pollElapsedSec}
              active={processing}
            />
            <AiGenFunFactsPanel active={processing} />
          </Box>
        ) : null}

        {step === 3 && envelope ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography variant="body2">
              Đã sinh {envelope.sections.length} phần.
              {envelope.meta?.summaryMessage ? ` ${envelope.meta.summaryMessage}` : ""}
            </Typography>
            {envelope.sections.map((section, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                {section.title ?? `Phần ${i + 1}`}: {section.questions?.length ?? 0} câu (
                {section.questionType})
              </Typography>
            ))}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ ...muDialogFooter, px: 2, py: 1.5, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {step > 0 && step < 3 ? (
            <Button
              sx={muFooterBtnOutlined}
              startIcon={<ArrowBackIcon />}
              disabled={uploading || outlining || processing || applying}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Quay lại
            </Button>
          ) : (
            <Button
              sx={muFooterBtnOutlined}
              onClick={handleClose}
              disabled={uploading || outlining || processing || applying}
            >
              Hủy
            </Button>
          )}
          {step === 2 && !isMobile ? (
            <Typography sx={{ fontSize: 11, color: "#64748b" }}>✨ {AI_EXAM_PAPER_PROCESSING_HINT}</Typography>
          ) : null}
        </Box>
        <Box>
        {step === 0 ? (
          <Button
            sx={muFooterBtnPrimary}
            onClick={() => void runOutline()}
            disabled={uploading || outlining || !file}
            startIcon={outlining ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {outlining ? "Đang phân tích…" : "Phân tích outline"}
          </Button>
        ) : null}
        {step === 1 ? (
          <Button
            sx={muFooterBtnPrimary}
            onClick={() => void startGeneration()}
            disabled={sectionSpecs.length === 0 || sumSectionQuestions(sectionSpecs) > 50}
          >
            Sinh đề ({sumSectionQuestions(sectionSpecs)} câu)
          </Button>
        ) : null}
        {step === 3 ? (
          <Button
            sx={muFooterBtnPrimary}
            onClick={handleApply}
            disabled={applying}
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Áp dụng vào đề
          </Button>
        ) : null}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
