import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  apiGetAiTask,
  apiReportAiTaskPollTimeout,
  type AiExamPaperGenEnvelope,
} from "../../../shared/api/aiTask";
import {
  apiCreateExamPaper,
  apiCreateSimilarExamPaperGenTask,
} from "../../../shared/api/examPaper";
import { paths } from "../../../shared/constants/paths";
import { buildExerciseSetPayloadJson } from "../../../shared/lesson/exercisePayload";
import {
  AiGenFunFactsPanel,
  AiGenProcessingDecorations,
  AiGenProcessingPanel,
} from "../exercise/AiGenProcessingPanel";

type ExamPaperSimilarAiDialogProps = {
  open: boolean;
  sourceExamPaperId: string;
  sourceTitle: string;
  sourceInstruction?: string;
  sectionCount: number;
  totalQuestions: number;
  onClose: () => void;
};

export function ExamPaperSimilarAiDialog({
  open,
  sourceExamPaperId,
  sourceTitle,
  sourceInstruction,
  sectionCount,
  totalQuestions,
  onClose,
}: ExamPaperSimilarAiDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const pollStartedRef = useRef(0);

  const [newExamTitle, setNewExamTitle] = useState("");
  const [newPaperInstruction, setNewPaperInstruction] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [promptLang, setPromptLang] = useState("en");
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pollElapsedSec, setPollElapsedSec] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  const resetState = useCallback(() => {
    setNewExamTitle(`Đề tương tự: ${sourceTitle}`);
    setNewPaperInstruction(sourceInstruction ?? "");
    setDifficulty(2);
    setPromptLang("en");
    setProcessing(false);
    setCreating(false);
    setTaskId(null);
    setError("");
    setPollElapsedSec(0);
    setProgressMessage("");
    setProgressPercent(null);
    pollStartedRef.current = 0;
  }, [sourceTitle, sourceInstruction]);

  useEffect(() => {
    if (open) resetState();
  }, [open, resetState]);

  const handleClose = () => {
    if (processing || creating) return;
    onClose();
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
    if (totalQuestions < 1 || sectionCount < 1) {
      setError("Đề nguồn cần có ít nhất một section với câu hỏi.");
      return;
    }
    setError("");
    setProcessing(true);
    setPollElapsedSec(0);
    setProgressPercent(null);
    pollStartedRef.current = Date.now();
    setProgressMessage("Đang khởi tạo tác vụ sinh đề tương tự…");
    try {
      const body = await apiCreateSimilarExamPaperGenTask(sourceExamPaperId, {
        newExamTitle: newExamTitle.trim() || undefined,
        newPaperInstruction: newPaperInstruction.trim() || undefined,
        difficulty,
        promptLang,
      });
      const id = body.taskId;
      if (!id) throw new Error("Không nhận được taskId");
      setTaskId(id);
    } catch (err) {
      setProcessing(false);
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

    const createExamFromEnvelope = async (envelope: AiExamPaperGenEnvelope) => {
      setCreating(true);
      try {
        const sections = (envelope.sections ?? []).map((section, index) => {
          const questions = draftsToExerciseQuestions(section.questions ?? []);
          const payloadJson = buildExerciseSetPayloadJson({
            title: section.title,
            instruction: section.instruction,
            questions,
          });
          return {
            title: section.title,
            instruction: section.instruction,
            questionType: section.questionType,
            displayOrder: index,
            payloadJson,
          };
        });
        const response = await apiCreateExamPaper({
          title: envelope.examTitle ?? newExamTitle.trim() ?? `Đề tương tự: ${sourceTitle}`,
          instruction:
            envelope.paperInstruction ?? (newPaperInstruction.trim() || undefined),
          status: "DRAFT",
          sections,
        });
        const created = (response.data ?? response.result) as { id?: string } | undefined;
        if (!created?.id) {
          throw new Error("Không tạo được đề mới.");
        }
        onClose();
        navigate(`/${paths.ADMIN}/${paths.EXAM_PAPER_EDITOR.replace(":examPaperId", created.id)}`);
      } catch (err) {
        setError((err as Error)?.message ?? "Sinh xong nhưng không tạo được đề mới.");
        setProcessing(false);
      } finally {
        setCreating(false);
      }
    };

    const poll = async () => {
      if (cancelled) return;
      const elapsed = Date.now() - pollStartedRef.current;
      if (elapsed > AI_EXAM_PAPER_POLL_MAX_MS) {
        setProcessing(false);
        setError("Xử lý quá lâu — thử lại sau hoặc giảm số phần/câu.");
        void apiReportAiTaskPollTimeout(taskId).catch(() => undefined);
        return;
      }
      try {
        const task = await apiGetAiTask(taskId);
        applyTaskProgress(task);
        if (task.status === "DONE") {
          applyTaskProgress({ progressMessage: "Hoàn thành — đang tạo đề mới…", progressPercent: 100 });
          const output = task.outputJson as AiExamPaperGenEnvelope | undefined;
          if (!output?.sections?.length) {
            setProcessing(false);
            setError("AI không trả về section nào.");
            return;
          }
          await createExamFromEnvelope(output);
          return;
        }
        if (task.status === "FAILED") {
          setProcessing(false);
          setError(task.errorMessage ?? "Sinh đề tương tự thất bại.");
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
  }, [
    taskId,
    processing,
    newExamTitle,
    newPaperInstruction,
    sourceTitle,
    navigate,
    onClose,
  ]);

  const busy = processing || creating;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      className={`ai-gen-dialog ai-gen-dialog--exam-similar${isMobile ? " ai-gen-dialog--mobile" : ""}`}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          minHeight: isMobile ? "100%" : busy ? 580 : undefined,
          maxWidth: isMobile ? "100%" : "920px",
        },
      }}
    >
      <DialogTitle className="ai-gen-dialog__title" sx={{ pr: 6, position: "relative" }}>
        <AutoAwesomeOutlinedIcon className="ai-gen-dialog__title-icon" />
        <span className="ai-gen-dialog__title-text">AI — Tạo đề tương tự</span>
        <IconButton
          aria-label="Đóng"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          disabled={busy}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="ai-gen-dialog__content" dividers sx={{ p: isMobile ? 1.5 : 2.5, display: "grid", gap: 2 }}>
        {error ? (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {!busy ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Sinh đề mới cùng cấu trúc ({sectionCount} phần, {totalQuestions} câu) từ đề hiện tại.
              Nội dung mới — không copy nguyên văn; đáp án nguồn không gửi cho AI.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Nguồn: {sourceTitle}
            </Typography>
            <TextField
              label="Tên đề mới"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              sx={muTextFieldSx}
            />
            <TextField
              label="Hướng dẫn chung (đề mới)"
              multiline
              minRows={2}
              value={newPaperInstruction}
              onChange={(e) => setNewPaperInstruction(e.target.value)}
              sx={muTextFieldSx}
            />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                label="Độ khó"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                sx={{ ...muTextFieldSx, minWidth: 120 }}
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Ngôn ngữ stem"
                value={promptLang}
                onChange={(e) => setPromptLang(e.target.value)}
                sx={{ ...muTextFieldSx, minWidth: 140 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="vi">Tiếng Việt</MenuItem>
              </TextField>
            </Box>
          </>
        ) : (
          <Box className="ai-gen-processing ai-gen-processing--exam-similar" sx={{ position: "relative", minHeight: 360 }}>
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              progressMessage={
                creating ? "Đang tạo đề mới…" : progressMessage || "Đang sinh đề tương tự…"
              }
              progressPercent={progressPercent}
              elapsedSec={pollElapsedSec}
              active={processing}
            />
            <AiGenFunFactsPanel active={processing} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ ...muDialogFooter, px: 2, py: 1.5, justifyContent: "space-between" }}>
        {!busy ? (
          <>
            <Button onClick={handleClose} sx={muFooterBtnOutlined}>
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={() => void startGeneration()}
              sx={muFooterBtnPrimary}
              startIcon={<AutoAwesomeOutlinedIcon />}
            >
              Bắt đầu sinh
            </Button>
          </>
        ) : (
          <>
            {!isMobile ? (
              <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                ✨ {AI_EXAM_PAPER_PROCESSING_HINT}
              </Typography>
            ) : null}
            <Typography sx={muFieldLabel} color="text.secondary">
              {creating ? "Đang lưu đề mới…" : "Vui lòng chờ…"}
            </Typography>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
