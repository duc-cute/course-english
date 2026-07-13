import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";
import { AiGenProcessingDecorations, AiGenProcessingPanel } from "../exercise/AiGenProcessingPanel";
import { AI_TASK_PROCESSING_HINT } from "../../../shared/ai/questionGen/aiTaskPolling";
import { isBankAiDraftValid, revalidateBankAiDrafts } from "../../../shared/ai/questionGen/bankDraftValidate";
import { useQuestionGenTask } from "../../../shared/ai/questionGen/useQuestionGenTask";
import { draftToExerciseQuestion } from "../../../shared/ai/questionGen/draftToExercise";
import {
  apiQuestionBankRewrite,
  apiQuestionBankSimilar,
  type QuestionBankAiAction,
} from "../../../shared/api/questionAi";
import { apiGetQuestionById, apiUpdateQuestion, type QuestionRecord } from "../../../shared/api/question";
import type { ApiResponse } from "../../../shared/api/types";
import {
  exerciseQuestionToQuestionForm,
  recordToFormMeta,
} from "../../../shared/lesson/questionBankUtils";
import { saveAiDraftsToBank } from "../../../shared/lesson/questionBankAiGenSave";
import type { BankImportBatchResult } from "../../../shared/lesson/questionBankImport";
import { countSelectedValidBankDrafts, QuestionBankAiPreviewStep } from "./QuestionBankAiPreviewStep";

const ACTION_LABELS: Record<QuestionBankAiAction, string> = {
  SIMILAR: "Sinh câu tương tự",
  REWRITE: "Viết lại (bản sao)",
  SIMPLIFY: "Đơn giản hóa (bản sao)",
  INCREASE_DIFFICULTY: "Tăng độ khó (bản sao)",
};

const FORK_ACTIONS = new Set<QuestionBankAiAction>(["REWRITE", "SIMPLIFY", "INCREASE_DIFFICULTY"]);

type Step = "start" | "processing" | "preview";

type QuestionBankAiActionDialogProps = {
  open: boolean;
  questionId: string | null;
  action: QuestionBankAiAction | null;
  onClose: () => void;
  onSaved?: (result?: BankImportBatchResult) => void;
};

export function QuestionBankAiActionDialog({
  open,
  questionId,
  action,
  onClose,
  onSaved,
}: QuestionBankAiActionDialogProps) {
  const [step, setStep] = useState<Step>("start");
  const [sourceRecord, setSourceRecord] = useState<QuestionRecord | null>(null);
  const [forkQuestionId, setForkQuestionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [startError, setStartError] = useState("");
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

  const isFork = action != null && FORK_ACTIONS.has(action);

  const {
    isBusy,
    drafts,
    setDrafts,
    summaryMessage,
    error,
    progressMessage,
    progressPercent,
    pollElapsedSec,
    reset: resetTask,
    pollTask,
  } = useQuestionGenTask({ scope: "question-bank" });

  const displayError = startError || error;

  const reset = useCallback(() => {
    setStep("start");
    setSourceRecord(null);
    setForkQuestionId(null);
    setQuestionCount(1);
    setAdditionalInstructions("");
    setSaving(false);
    setStartError("");
    setDraftTitles({});
    resetTask();
  }, [resetTask]);

  const runBankAi = useCallback(async () => {
    if (!questionId || !action) return;
    setStartError("");
    setStep("processing");

    try {
      const detailRes = await apiGetQuestionById(questionId);
      const detail =
        (detailRes as ApiResponse<QuestionRecord>).result ?? (detailRes as ApiResponse<QuestionRecord>).data;
      if (detail) setSourceRecord(detail);

      let taskId: string;
      if (action === "SIMILAR") {
        const created = await apiQuestionBankSimilar(questionId, {
          questionCount,
          additionalInstructions: additionalInstructions.trim() || undefined,
        });
        taskId = created.taskId;
      } else {
        const created = await apiQuestionBankRewrite(questionId, { mode: action });
        taskId = created.taskId;
        if (created.targetQuestionId) {
          setForkQuestionId(created.targetQuestionId);
        }
      }

      const result = await pollTask(taskId);
      if (!result) {
        setStep("start");
        return;
      }
      setDrafts(revalidateBankAiDrafts(result.questions));
      setStep("preview");
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Không tạo được tác vụ AI.");
      setStep("start");
    }
  }, [
    action,
    additionalInstructions,
    pollTask,
    questionCount,
    questionId,
    setDrafts,
  ]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !questionId) return;
    let cancelled = false;
    void apiGetQuestionById(questionId).then((detailRes) => {
      if (cancelled) return;
      const detail =
        (detailRes as ApiResponse<QuestionRecord>).result ?? (detailRes as ApiResponse<QuestionRecord>).data;
      if (detail) setSourceRecord(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [open, questionId]);

  const title = action ? ACTION_LABELS[action] : "AI câu hỏi";

  const forkNote = useMemo(() => {
    if (!isFork) return null;
    return (
      <Alert severity="info" sx={{ mb: 2, fontSize: 13 }}>
        Hệ thống sẽ nhân bản câu gốc thành bản <strong>Nháp</strong> rồi AI sửa trên bản sao — câu gốc và
        lesson đang trỏ tới câu cũ không đổi.
        {forkQuestionId ? (
          <>
            {" "}
            Bản sao: <code>{forkQuestionId.slice(0, 8)}…</code>
          </>
        ) : null}
      </Alert>
    );
  }, [forkQuestionId, isFork]);

  const handleClose = () => {
    if (isBusy || saving) return;
    onClose();
  };

  const handleApplySimilar = async () => {
    const selected = drafts.filter((d) => d.selected && isBankAiDraftValid(d));
    if (!selected.length) return;
    setSaving(true);
    try {
      const meta = {
        status: "DRAFT" as const,
        topic: sourceRecord?.topic?.trim() || "AI similar",
        categoryId: sourceRecord?.categoryId,
        skill: sourceRecord?.skill,
        cefrLevel: sourceRecord?.cefrLevel,
        difficulty: sourceRecord?.difficulty,
        promptLang: sourceRecord?.promptLang,
      };
      const items = selected.map((d) => ({
        draft: d,
        title: draftTitles[d.tempId],
      }));
      const result = await saveAiDraftsToBank(items, meta);
      onSaved?.(result);
      onClose();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Không lưu được câu mới.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFork = async () => {
    const draft = drafts.find((d) => isBankAiDraftValid(d));
    const targetId = forkQuestionId;
    if (!draft || !targetId) return;

    setSaving(true);
    try {
      const forkRes = await apiGetQuestionById(targetId);
      const fork =
        (forkRes as ApiResponse<QuestionRecord>).result ?? (forkRes as ApiResponse<QuestionRecord>).data;
      if (!fork) throw new Error("Không tải được bản sao.");

      const exercise = draftToExerciseQuestion(draft);
      if (!exercise) throw new Error("Không chuyển được bản nháp AI.");

      const payload = exerciseQuestionToQuestionForm(exercise, {
        ...recordToFormMeta(fork),
        title: fork.title,
        source: "AI",
        aiGenerated: true,
      });
      await apiUpdateQuestion(targetId, payload);
      onSaved?.();
      onClose();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Không áp dụng được lên bản sao.");
    } finally {
      setSaving(false);
    }
  };

  const selectedValid = countSelectedValidBankDrafts(drafts);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={step === "preview" ? "md" : "sm"}
      PaperProps={{
        sx: {
          ...muDialogPaper,
          ...(step === "processing" ? { maxWidth: 920 } : {}),
        },
      }}
      className={step === "processing" ? "ai-gen-processing--question-bank" : undefined}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
        <AutoAwesomeOutlinedIcon color="secondary" fontSize="small" />
        {title}
        <IconButton
          aria-label="Đóng"
          onClick={handleClose}
          disabled={isBusy || saving}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {displayError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        ) : null}

        {step === "start" ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {forkNote}
            {action === "SIMILAR" ? (
              <>
                <TextField
                  label="Số câu tương tự (1–5)"
                  type="number"
                  size="small"
                  value={questionCount}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                    setQuestionCount(n);
                  }}
                  inputProps={{ min: 1, max: 5 }}
                  sx={muTextFieldSx}
                  fullWidth
                />
                <TextField
                  label="Hướng dẫn thêm (tuỳ chọn)"
                  size="small"
                  multiline
                  minRows={2}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  sx={muTextFieldSx}
                  fullWidth
                />
              </>
            ) : null}
            {sourceRecord?.promptText ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Câu gốc
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }} color="text.secondary">
                  {sourceRecord.promptText.slice(0, 280)}
                  {sourceRecord.promptText.length > 280 ? "…" : ""}
                </Typography>
              </Box>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              Tác vụ AI dùng chung quota sinh câu hôm nay. {AI_TASK_PROCESSING_HINT}
            </Typography>
          </Box>
        ) : null}

        {step === "processing" ? (
          <Box sx={{ position: "relative", minHeight: 420 }}>
            <AiGenProcessingDecorations />
            <AiGenProcessingPanel
              message={progressMessage || "Đang sinh câu bằng AI…"}
              percent={progressPercent}
              elapsedSec={pollElapsedSec}
            />
          </Box>
        ) : null}

        {step === "preview" ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {isFork ? (
              <Alert severity="success" sx={{ fontSize: 13 }}>
                Áp dụng sẽ cập nhật <strong>bản sao (Nháp)</strong> — không sửa câu gốc.
              </Alert>
            ) : null}
            <QuestionBankAiPreviewStep
              drafts={drafts}
              draftTitles={draftTitles}
              summaryMessage={summaryMessage}
              skippedUnsupported={0}
              onDraftsChange={setDrafts}
              onDraftTitleChange={(tempId, t) => setDraftTitles((prev) => ({ ...prev, [tempId]: t }))}
            />
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={muDialogFooter}>
        {step === "start" ? (
          <>
            <Button sx={muFooterBtnOutlined} onClick={handleClose}>
              Hủy
            </Button>
            <Button
              variant="contained"
              sx={muFooterBtnPrimary}
              onClick={() => void runBankAi()}
              disabled={!questionId || !action}
            >
              Bắt đầu AI
            </Button>
          </>
        ) : null}

        {step === "processing" ? (
          <Button sx={muFooterBtnOutlined} disabled>
            Đang xử lý…
          </Button>
        ) : null}

        {step === "preview" ? (
          <>
            <Button sx={muFooterBtnOutlined} disabled={saving} onClick={handleClose}>
              Hủy
            </Button>
            {isFork ? (
              <Button
                variant="contained"
                sx={muFooterBtnPrimary}
                disabled={saving || !drafts.some(isBankAiDraftValid)}
                onClick={() => void handleApplyFork()}
              >
                {saving ? "Đang lưu…" : "Áp dụng lên bản sao"}
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={muFooterBtnPrimary}
                disabled={saving || selectedValid < 1}
                onClick={() => void handleApplySimilar()}
              >
                {saving ? "Đang lưu…" : `Lưu ${selectedValid} câu mới`}
              </Button>
            )}
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
