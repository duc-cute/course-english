import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";
import { apiExplainQuestion, type QuestionAiExplainResult } from "../../../shared/api/questionAi";
import { apiGetQuestionById, apiUpdateQuestion, type QuestionRecord } from "../../../shared/api/question";
import type { ApiResponse } from "../../../shared/api/types";
import {
  exerciseQuestionToQuestionForm,
  questionRecordToExerciseQuestion,
  recordToFormMeta,
} from "../../../shared/lesson/questionBankUtils";

type QuestionBankExplainDialogProps = {
  open: boolean;
  questionId: string | null;
  onClose: () => void;
  onApplied?: () => void;
};

export function QuestionBankExplainDialog({
  open,
  questionId,
  onClose,
  onApplied,
}: QuestionBankExplainDialogProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<QuestionRecord | null>(null);
  const [result, setResult] = useState<QuestionAiExplainResult | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setApplying(false);
    setError("");
    setRecord(null);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!open || !questionId) {
      reset();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setResult(null);

    void (async () => {
      try {
        const detailRes = await apiGetQuestionById(questionId);
        const detail =
          (detailRes as ApiResponse<QuestionRecord>).result ?? (detailRes as ApiResponse<QuestionRecord>).data;
        if (cancelled) return;
        if (!detail) {
          setError("Không tải được câu hỏi.");
          return;
        }
        setRecord(detail);

        const explain = await apiExplainQuestion(questionId);
        if (cancelled) return;
        setResult(explain);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tạo được giải thích AI.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, questionId, reset]);

  const handleClose = () => {
    if (loading || applying) return;
    onClose();
  };

  const handleApply = async () => {
    if (!record || !result?.explanation?.trim()) return;
    setApplying(true);
    setError("");
    try {
      const exercise = questionRecordToExerciseQuestion(record);
      const withExplanation = { ...exercise, explanation: result.explanation.trim() };
      const payload = exerciseQuestionToQuestionForm(withExplanation, recordToFormMeta(record));
      await apiUpdateQuestion(record.id, payload);
      onApplied?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được giải thích.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon color="secondary" fontSize="small" />
        AI giải thích đáp án (tiếng Việt)
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 4 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Đang tạo giải thích bằng AI…
            </Typography>
          </Box>
        ) : null}

        {!loading && result ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {record ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Câu hỏi
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {record.promptText}
                </Typography>
              </Box>
            ) : null}

            {result.previousExplanation ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Giải thích hiện tại
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {result.previousExplanation}
                </Typography>
              </Box>
            ) : null}

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Giải thích AI (mới)
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {result.explanation}
              </Typography>
              {result.durationMs != null ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {result.model ? `${result.model} · ` : ""}
                  {(result.durationMs / 1000).toFixed(1)}s
                </Typography>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button sx={muFooterBtnOutlined} disabled={loading || applying} onClick={handleClose}>
          {result ? "Hủy" : "Đóng"}
        </Button>
        <Button
          variant="contained"
          sx={muFooterBtnPrimary}
          disabled={loading || applying || !result?.explanation?.trim()}
          onClick={() => void handleApply()}
        >
          {applying ? "Đang lưu…" : "Áp dụng vào câu hỏi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
