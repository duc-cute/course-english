import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";
import { LessonPagingAutocomplete } from "../LessonPagingAutocomplete";
import { RecurrenceScopeDialog } from "./RecurrenceScopeDialog";
import { formatSessionTimeRange, sessionToUpdatePayload } from "./teachingPlanUtils";
import type { LessonRecord } from "../../../shared/api/lesson";
import {
  apiUpdateClassSession,
  type ClassSessionRecord,
  type RecurrenceScope,
} from "../../../shared/api/classSession";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
} from "../../../pages/admin/manageUserUiStyles";

type AssignLessonDialogProps = {
  open: boolean;
  session: ClassSessionRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AssignLessonDialog({ open, session, onClose, onSaved }: AssignLessonDialogProps) {
  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    setError("");
    setScopeOpen(false);
    setLesson(
      session.lessonId
        ? {
            id: session.lessonId,
            title: session.lessonTitle ?? "Bài đã gán",
            slug: "",
          }
        : null,
    );
  }, [open, session]);

  const performAssign = async (scope?: RecurrenceScope) => {
    if (!session?.id) return;
    const payload = sessionToUpdatePayload(session, { lessonId: lesson?.id ?? null });
    if (!payload) {
      setError("Thiếu thông tin lớp học của buổi dạy.");
      return;
    }
    if (!lesson?.id) {
      setError("Vui lòng chọn bài học.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiUpdateClassSession(session.id, payload, scope);
      setScopeOpen(false);
      onSaved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể gán bài học.");
      setScopeOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => {
    if (!lesson?.id) {
      setError("Vui lòng chọn bài học.");
      return;
    }
    if (session?.recurring) {
      setScopeOpen(true);
      return;
    }
    void performAssign();
  };

  if (!session) return null;

  const classLabel = session.classroomName || session.classroomCode || "Lớp học";

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>Gán bài học cho buổi dạy</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "var(--ac-surface-container-low)" }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: "var(--ac-on-surface)" }}>
              {classLabel}: {session.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--ac-on-surface-variant)" }}>
              {formatSessionTimeRange(session.startAt, session.endAt)}
            </Typography>
          </Box>
          {session.recurring ? (
            <Alert severity="info">Buổi thuộc chuỗi lặp tuần — lưu sẽ hỏi phạm vi áp dụng.</Alert>
          ) : null}
          <LessonPagingAutocomplete value={lesson} onChange={setLesson} helperText="Tìm theo tên bài học" />
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <AppButton variant="outlined" sx={muFooterBtnOutlined} onClick={onClose} disabled={submitting}>
            Hủy
          </AppButton>
          <AppButton variant="contained" sx={muFooterBtnPrimary} onClick={() => void handleSave()} disabled={submitting}>
            {submitting ? "Đang lưu…" : "Gán bài"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <RecurrenceScopeDialog
        open={scopeOpen}
        mode="update"
        onClose={() => setScopeOpen(false)}
        loading={submitting}
        onConfirm={(scope) => void performAssign(scope)}
      />
    </>
  );
}
