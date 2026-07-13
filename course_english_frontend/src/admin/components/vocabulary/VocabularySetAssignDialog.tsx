import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { apiGetClassrooms, type ClassroomRecord } from "../../../shared/api/classroom";
import type { ApiResponse } from "../../../shared/api/types";
import {
  apiCreateVocabularySetAssignment,
} from "../../../shared/api/vocabularySetAssignment";
import type { VocabularySetRecord } from "../../../shared/api/vocabularySet";
import {
  muDialogFooter,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

type VocabularySetAssignDialogProps = {
  open: boolean;
  set: VocabularySetRecord | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

function unwrapClassroomRows(response: unknown): ClassroomRecord[] {
  const payload = response as ApiResponse<{ result?: ClassroomRecord[] }> & {
    result?: ClassroomRecord[];
    data?: { result?: ClassroomRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  if (Array.isArray(raw)) return raw;
  return [];
}

export function VocabularySetAssignDialog({
  open,
  set,
  onClose,
  onSuccess,
}: VocabularySetAssignDialogProps) {
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadClassrooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await apiGetClassrooms({ page: 0, size: 200, sort: "name,asc" });
      setClassrooms(unwrapClassroomRows(response));
    } catch (err) {
      setClassrooms([]);
      setError((err as { message?: string })?.message || "Không tải được danh sách lớp.");
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setClassroomId("");
    setDueAt("");
    setNote("");
    setError("");
    void loadClassrooms();
  }, [open, loadClassrooms]);

  const handleSubmit = async () => {
    if (!set?.id || !classroomId) {
      setError("Chọn lớp học để gán bộ từ.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiCreateVocabularySetAssignment({
        vocabularySetId: set.id,
        classroomId,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        note: note.trim() || undefined,
      });
      onSuccess(`Đã gán “${set.title}” cho lớp.`);
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Gán bộ từ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gán bộ từ cho lớp</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {set ? (
          <Alert severity="info" sx={{ borderRadius: "12px" }}>
            Bộ từ: <strong>{set.title}</strong>
            {set.itemCount != null ? ` · ${set.itemCount} từ` : ""}
          </Alert>
        ) : null}
        {error ? (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          select
          label="Lớp học"
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
          disabled={loadingRooms || submitting}
          fullWidth
          sx={muTextFieldSx}
        >
          <MenuItem value="">
            <em>{loadingRooms ? "Đang tải…" : "Chọn lớp"}</em>
          </MenuItem>
          {classrooms.map((room) => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
              {room.code ? ` (${room.code})` : ""}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Hạn hoàn thành (tuỳ chọn)"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={submitting}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={muTextFieldSx}
        />
        <TextField
          label="Ghi chú (tuỳ chọn)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
          fullWidth
          multiline
          minRows={2}
          sx={muTextFieldSx}
        />
      </DialogContent>
      <DialogActions sx={muDialogFooter}>
        <Button onClick={onClose} disabled={submitting} sx={muFooterBtnOutlined}>
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={submitting || !classroomId}
          sx={muFooterBtnPrimary}
        >
          {submitting ? "Đang gán…" : "Gán cho lớp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
