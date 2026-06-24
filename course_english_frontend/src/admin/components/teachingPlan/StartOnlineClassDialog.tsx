import ContentPasteGoOutlinedIcon from "@mui/icons-material/ContentPasteGoOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { AppButton } from "../AppButton";
import { ConfirmDialog } from "../ConfirmDialog";
import { meetLinkValidationMessage } from "./meetLinkUtils";
import { formatSessionTimeRange } from "./teachingPlanUtils";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

type StartOnlineClassDialogProps = {
  open: boolean;
  session: ClassSessionRecord | null;
  saving?: boolean;
  cancelling?: boolean;
  onClose: () => void;
  onSave: (meetLink: string) => Promise<void>;
  onCancelStart?: () => Promise<void>;
};

export function StartOnlineClassDialog({
  open,
  session,
  saving = false,
  cancelling = false,
  onClose,
  onSave,
  onCancelStart,
}: StartOnlineClassDialogProps) {
  const [meetLink, setMeetLink] = useState("");
  const [error, setError] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMeetLink(session?.meetLink ?? "");
    setError("");
    setCancelConfirmOpen(false);
  }, [open, session?.id, session?.meetLink]);

  const classLabel = session?.classroomName || session?.classroomCode || "Lớp học";
  const canUndoStart = Boolean(session?.startedAt && !session?.meetLink && onCancelStart);
  const busy = saving || cancelling;

  const handlePasteFromClipboard = async () => {
    setError("");
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        setMeetLink(text.trim());
      }
    } catch {
      setError("Không đọc được clipboard. Hãy dán thủ công (Ctrl+V).");
    }
  };

  const handleSave = async () => {
    const validationError = meetLinkValidationMessage(meetLink);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    try {
      await onSave(meetLink.trim());
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Không thể lưu link Meet.";
      setError(message);
    }
  };

  const handleConfirmCancelStart = async () => {
    if (!onCancelStart) return;
    setError("");
    try {
      await onCancelStart();
      setCancelConfirmOpen(false);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Không thể hủy bắt đầu lớp.";
      setError(message);
      setCancelConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Dán link Google Meet</DialogTitle>
        <DialogContent>
          {session ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: "var(--ac-on-surface-variant)", mb: 0.5 }}>
                {classLabel}: {session.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--ac-on-surface-variant)" }}>
                {formatSessionTimeRange(session.startAt, session.endAt)}
              </Typography>
            </Box>
          ) : null}

          <Alert severity="info" sx={{ mb: 2 }}>
            Tạo phòng trên tab Meet vừa mở → <strong>Copy link</strong> → quay lại đây →{" "}
            <strong>Dán &amp; lưu</strong>. Học sinh sẽ thấy nút Vào lớp sau khi lưu.
          </Alert>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <TextField
            label="Link Google Meet / Zoom"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            fullWidth
            autoFocus
            sx={muTextFieldSx}
          />

          <Box sx={{ mt: 1.5 }}>
            <AppButton
              variant="outlined"
              size="small"
              startIcon={<ContentPasteGoOutlinedIcon />}
              onClick={() => void handlePasteFromClipboard()}
              disabled={busy}
              sx={{ textTransform: "none" }}
            >
              Dán từ clipboard
            </AppButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ ...muDialogFooter, justifyContent: "space-between" }}>
          {canUndoStart ? (
            <AppButton
              variant="outlined"
              color="error"
              startIcon={<UndoOutlinedIcon />}
              onClick={() => setCancelConfirmOpen(true)}
              disabled={busy}
              sx={{ textTransform: "none", minWidth: 140 }}
            >
              Hủy bắt đầu
            </AppButton>
          ) : (
            <span />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <AppButton variant="outlined" sx={muFooterBtnOutlined} onClick={onClose} disabled={busy}>
              Đóng
            </AppButton>
            <AppButton
              variant="contained"
              sx={muFooterBtnPrimary}
              startIcon={<VideocamOutlinedIcon />}
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? "Đang lưu…" : "Lưu & báo học sinh"}
            </AppButton>
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Hủy bắt đầu lớp online?"
        content="Bạn sẽ quay lại trạng thái chưa bắt đầu. Tab Meet đã mở (nếu có) có thể đóng thủ công."
        cancelText="Không"
        confirmText="Hủy bắt đầu"
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => void handleConfirmCancelStart()}
        loading={cancelling}
      />
    </>
  );
}
