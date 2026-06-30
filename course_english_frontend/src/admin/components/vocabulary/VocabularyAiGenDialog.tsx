import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
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
  IconButton,
  MenuItem,
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
  AI_TASK_POLL_INTERVAL_MS,
  AI_TASK_POLL_MAX_MS,
} from "../../../shared/ai/questionGen/aiTaskPolling";
import type { VocabularyItemRecord } from "../../../shared/api/vocabularySet";
import { resolveStorageAssetUrl } from "../../../shared/api/file";
import {
  apiCreateVocabularySetGenTask,
  apiGetAiTask,
  apiReportAiTaskPollTimeout,
  type AiVocabularySetGenEnvelope,
} from "../../../shared/api/aiTask";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "../exercise/AiGenProcessingPanel";

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "IELTS 5.5", "IELTS 6.5", "IELTS 7.5"];

type VocabularyAiGenDialogProps = {
  open: boolean;
  onClose: () => void;
  onGenerated: (payload: {
    title: string;
    description: string;
    coverImageUrl?: string;
    items: VocabularyItemRecord[];
  }) => void;
};

type Step = "config" | "processing" | "preview";

export function VocabularyAiGenDialog({ open, onClose, onGenerated }: VocabularyAiGenDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const pollStartedRef = useRef(0);

  const [step, setStep] = useState<Step>("config");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [languageLevel, setLanguageLevel] = useState("A2");
  const [wordCount, setWordCount] = useState(20);
  const [titleHint, setTitleHint] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generateCover, setGenerateCover] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pollElapsedSec, setPollElapsedSec] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<AiVocabularySetGenEnvelope | null>(null);

  const reset = useCallback(() => {
    setStep("config");
    setTopicPrompt("");
    setLanguageLevel("A2");
    setWordCount(20);
    setTitleHint("");
    setAdditionalInstructions("");
    setGenerateCover(true);
    setProcessing(false);
    setPollElapsedSec(0);
    setProgressMessage("");
    setProgressPercent(null);
    setError("");
    setEnvelope(null);
    pollStartedRef.current = 0;
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!processing) return undefined;
    const startedAt = pollStartedRef.current || Date.now();
    pollStartedRef.current = startedAt;
    const elapsedTimer = window.setInterval(() => {
      setPollElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(elapsedTimer);
  }, [processing]);

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

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const pollTask = useCallback(async (taskId: string) => {
    const started = pollStartedRef.current || Date.now();
    pollStartedRef.current = started;

    while (Date.now() - started < AI_TASK_POLL_MAX_MS) {
      const task = await apiGetAiTask(taskId);
      applyTaskProgress(task);

      if (task.status === "DONE") {
        const output = task.outputJson as AiVocabularySetGenEnvelope | undefined;
        if (!output?.items?.length) {
          throw new Error("AI không trả danh sách từ.");
        }
        setEnvelope(output);
        setStep("preview");
        setProcessing(false);
        return;
      }

      if (task.status === "FAILED") {
        throw new Error(task.errorMessage || "Sinh bộ từ thất bại.");
      }

      await new Promise((r) => setTimeout(r, AI_TASK_POLL_INTERVAL_MS));
    }

    void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
    throw new Error("Hết thời gian chờ — thử lại sau.");
  }, []);

  const handleGenerate = async () => {
    const topic = topicPrompt.trim();
    if (!topic) {
      setError("Nhập chủ đề hoặc mô tả bộ từ.");
      return;
    }
    if (wordCount < 5 || wordCount > 50) {
      setError("Số từ từ 5 đến 50.");
      return;
    }

    setError("");
    setProcessing(true);
    setStep("processing");
    setPollElapsedSec(0);
    setProgressPercent(null);
    setProgressMessage("Đang tạo tác vụ…");
    pollStartedRef.current = Date.now();

    try {
      const created = await apiCreateVocabularySetGenTask({
        topicPrompt: topic,
        languageLevel: languageLevel || undefined,
        wordCount,
        titleHint: titleHint.trim() || undefined,
        additionalInstructions: additionalInstructions.trim() || undefined,
        generateCover,
      });
      await pollTask(created.taskId);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể sinh bộ từ.");
      setStep("config");
      setProcessing(false);
    }
  };

  const handleApply = () => {
    if (!envelope?.items?.length) return;
    onGenerated({
      title: envelope.title?.trim() || titleHint.trim() || "Bộ từ vựng mới",
      description: envelope.description?.trim() || "",
      coverImageUrl: envelope.coverImageUrl,
      items: envelope.items.map((item) => ({
        wordEn: item.wordEn,
        meaningVi: item.meaningVi,
        partOfSpeech: item.partOfSpeech,
        exampleSentence: item.exampleSentence,
      })),
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile && step === "processing"}
      PaperProps={{ sx: muDialogPaper }}
      className={`ai-gen-dialog ai-gen-dialog--vocab-set${isMobile ? " ai-gen-dialog--mobile" : ""}`}
    >
      <DialogTitle className="ai-gen-dialog__title" sx={{ pr: 6, position: "relative" }}>
        <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
        <span className="ai-gen-dialog__title-text">AI — Sinh bộ từ vựng</span>
        <IconButton
          aria-label="Đóng"
          onClick={handleClose}
          disabled={processing}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 2, minHeight: step === "processing" ? 360 : undefined }}>
        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {step === "config" ? (
          <>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              Mô tả chủ đề bộ từ — AI sinh tiêu đề, mô tả và danh sách từ (EN + nghĩa VI). Bạn xem trước và sửa
              trước khi lưu.
            </Typography>

            <TextField
              label={
                <>
                  Chủ đề / yêu cầu <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </>
              }
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              placeholder="VD: Từ vựng check-in sân bay, trình độ A2, tập trung hành lý và an ninh"
              sx={muTextFieldSx}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                select
                label="Trình độ"
                value={languageLevel}
                onChange={(e) => setLanguageLevel(e.target.value)}
                size="small"
                sx={muTextFieldSx}
              >
                {LANGUAGE_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Số từ"
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value) || 0)}
                inputProps={{ min: 5, max: 50 }}
                size="small"
                sx={muTextFieldSx}
              />
            </Box>

            <TextField
              label="Gợi ý tiêu đề (tuỳ chọn)"
              value={titleHint}
              onChange={(e) => setTitleHint(e.target.value)}
              fullWidth
              size="small"
              sx={muTextFieldSx}
            />

            <TextField
              label="Hướng dẫn thêm (tuỳ chọn)"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={muTextFieldSx}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={generateCover}
                  onChange={(e) => setGenerateCover(e.target.checked)}
                />
              }
              label="Sinh ảnh cover bộ từ (image-gen, +10–20s)"
            />
          </>
        ) : null}

        {step === "processing" ? (
          <Box className="ai-gen-processing ai-gen-processing--vocab-set" sx={{ position: "relative", minHeight: 320 }}>
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              active={processing}
              progressMessage={progressMessage || "Đang sinh bộ từ vựng…"}
              progressPercent={progressPercent}
              elapsedSec={pollElapsedSec}
            />
            <AiGenFunFactsPanel active={processing} />
          </Box>
        ) : null}

        {step === "preview" && envelope ? (
          <div className="vocab-set-editor vocab-set-editor--preview">
            <div className="vocab-set-editor__hero">
              {envelope.coverImageUrl ? (
                <div className="vocab-set-editor__cover-wrap">
                  <div className="vocab-set-editor__cover">
                    <img src={resolveStorageAssetUrl(envelope.coverImageUrl)} alt="Cover" />
                  </div>
                </div>
              ) : null}
              <div className="vocab-set-editor__meta">
                <div className="vocab-set-editor__field">
                  <span className="vocab-set-editor__label">Tiêu đề bộ từ</span>
                  <p className="vocab-set-editor__preview-title">{envelope.title}</p>
                </div>
                {envelope.description?.trim() ? (
                  <div className="vocab-set-editor__field">
                    <span className="vocab-set-editor__label">Mô tả chi tiết</span>
                    <p className="vocab-set-editor__preview-desc">{envelope.description}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="vocab-set-editor__table-wrap vocab-set-editor__table-wrap--preview">
              <div className="vocab-set-editor__table-card">
                <table className="vocab-set-editor__table">
                  <thead>
                    <tr>
                      <th className="vocab-set-editor__th vocab-set-editor__th--num">#</th>
                      <th className="vocab-set-editor__th">Từ vựng (Word)</th>
                      <th className="vocab-set-editor__th">Nghĩa (Meaning)</th>
                      <th className="vocab-set-editor__th vocab-set-editor__th--pos">Loại từ</th>
                      <th className="vocab-set-editor__th">Ví dụ (Example)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envelope.items.map((row, i) => (
                      <tr key={`${row.wordEn}-${i}`} className="vocab-set-editor__row">
                        <td className="vocab-set-editor__td vocab-set-editor__td--num">{i + 1}</td>
                        <td className="vocab-set-editor__td">
                          <span className="vocab-set-editor__preview-word">{row.wordEn}</span>
                        </td>
                        <td className="vocab-set-editor__td">{row.meaningVi}</td>
                        <td className="vocab-set-editor__td">
                          {row.partOfSpeech ? (
                            <span className="vocab-set-editor__pos-badge">{row.partOfSpeech}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="vocab-set-editor__td">
                          <span className="vocab-set-editor__preview-example">
                            {row.exampleSentence || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>

      <DialogActions sx={muDialogFooter}>
        {step === "config" ? (
          <>
            <Button onClick={handleClose} sx={muFooterBtnOutlined}>
              Hủy
            </Button>
            <Button
              variant="contained"
              className="ai-gen-footer-ai-btn"
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={() => void handleGenerate()}
              sx={muFooterBtnPrimary}
            >
              Sinh bộ từ
            </Button>
          </>
        ) : null}

        {step === "preview" ? (
          <>
            <Button
              onClick={() => {
                setStep("config");
                setEnvelope(null);
              }}
              sx={muFooterBtnOutlined}
            >
              Sinh lại
            </Button>
            <Button variant="contained" onClick={handleApply} sx={muFooterBtnPrimary}>
              Áp dụng vào form ({envelope?.items?.length ?? 0} từ)
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
