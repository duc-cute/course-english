import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ClassroomPagingAutocomplete } from "../ClassroomPagingAutocomplete";
import { LessonPagingAutocomplete } from "../LessonPagingAutocomplete";
import { AppButton } from "../AppButton";
import { ConfirmDialog } from "../ConfirmDialog";
import { RecurrenceScopeDialog } from "./RecurrenceScopeDialog";
import type { ClassroomRecord } from "../../../shared/api/classroom";
import type { LessonRecord } from "../../../shared/api/lesson";
import {
  apiCancelClassSession,
  apiCreateClassSession,
  apiCreateRecurringClassSessions,
  apiUpdateClassSession,
  type ClassSessionPayload,
  type ClassSessionRecord,
  type RecurrenceScope,
  type RecurringClassSessionPayload,
  type SessionType,
} from "../../../shared/api/classSession";
import {
  datetimeLocalToIso,
  extractDateFromDatetimeLocal,
  extractTimeFromDatetimeLocal,
  formatTodayIsoInTz,
  isoToDatetimeLocal,
  SESSION_TYPE_OPTIONS,
  WEEKDAY_OPTIONS,
} from "./teachingPlanUtils";
import { defaultDatetimeLocalForDay } from "./weekScheduleUtils";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

type ClassSessionFormModalProps = {
  open: boolean;
  editing: ClassSessionRecord | null;
  initialDay?: string;
  initialStartHour?: number;
  initialStartMinute?: number;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  classroom: ClassroomRecord | null;
  lesson: LessonRecord | null;
  title: string;
  sessionType: SessionType;
  startLocal: string;
  endLocal: string;
  meetLink: string;
  locationLabel: string;
  notes: string;
};

type RepeatState = {
  enabled: boolean;
  weekdays: number[];
  endMode: "date" | "weeks";
  rangeEnd: string;
  weekCount: number;
};

const defaultForm: FormState = {
  classroom: null,
  lesson: null,
  title: "",
  sessionType: "LIVE_CLASS",
  startLocal: "",
  endLocal: "",
  meetLink: "",
  locationLabel: "",
  notes: "",
};

const defaultRepeat: RepeatState = {
  enabled: false,
  weekdays: [1, 3],
  endMode: "weeks",
  rangeEnd: "",
  weekCount: 8,
};

export function ClassSessionFormModal({
  open,
  editing,
  initialDay,
  initialStartHour,
  initialStartMinute,
  onClose,
  onSaved,
}: ClassSessionFormModalProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [repeat, setRepeat] = useState<RepeatState>(defaultRepeat);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [scopeMode, setScopeMode] = useState<"update" | "cancel">("update");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");
    setCancelOpen(false);
    setScopeOpen(false);
    if (editing) {
      setForm({
        classroom: editing.classroomId
          ? {
              id: editing.classroomId,
              name: editing.classroomName ?? "",
              code: editing.classroomCode ?? "",
            }
          : null,
        lesson: editing.lessonId
          ? {
              id: editing.lessonId,
              title: editing.lessonTitle ?? "",
              slug: "",
            }
          : null,
        title: editing.title ?? "",
        sessionType: editing.sessionType ?? "LIVE_CLASS",
        startLocal: isoToDatetimeLocal(editing.startAt),
        endLocal: isoToDatetimeLocal(editing.endAt),
        meetLink: editing.meetLink ?? "",
        locationLabel: editing.locationLabel ?? "",
        notes: editing.notes ?? "",
      });
      setRepeat({ ...defaultRepeat, enabled: false });
    } else if (initialDay) {
      const startHour = initialStartHour ?? 19;
      const startMinute = initialStartMinute ?? 0;
      const endTotalMin = startHour * 60 + startMinute + 50;
      const endHour = Math.floor(endTotalMin / 60) % 24;
      const endMinute = endTotalMin % 60;
      setForm({
        ...defaultForm,
        startLocal: defaultDatetimeLocalForDay(initialDay, startHour, startMinute),
        endLocal: defaultDatetimeLocalForDay(initialDay, endHour, endMinute),
      });
      setRepeat({ ...defaultRepeat, enabled: false });
    } else {
      setForm(defaultForm);
      setRepeat(defaultRepeat);
    }
  }, [open, editing, initialDay, initialStartHour, initialStartMinute]);

  const buildPayload = (): ClassSessionPayload | null => {
    const classroom = form.classroom;
    const title = form.title.trim();
    if (!classroom?.id || !title || !form.startLocal || !form.endLocal) return null;
    return {
      classroomId: classroom.id,
      lessonId: form.lesson?.id ?? null,
      title,
      sessionType: form.sessionType,
      startAt: datetimeLocalToIso(form.startLocal),
      endAt: datetimeLocalToIso(form.endLocal),
      meetLink: form.meetLink.trim() || null,
      locationLabel: form.locationLabel.trim() || null,
      notes: form.notes.trim() || null,
    };
  };

  const buildRecurringPayload = (): RecurringClassSessionPayload | null => {
    const classroom = form.classroom;
    const title = form.title.trim();
    if (!classroom?.id || !title || !form.startLocal || !form.endLocal) return null;
    if (repeat.weekdays.length === 0) return null;

    const rangeStart = extractDateFromDatetimeLocal(form.startLocal);
    const payload: RecurringClassSessionPayload = {
      classroomId: classroom.id,
      lessonId: form.lesson?.id ?? null,
      title,
      sessionType: form.sessionType,
      weekdays: repeat.weekdays,
      rangeStart,
      startTime: extractTimeFromDatetimeLocal(form.startLocal),
      endTime: extractTimeFromDatetimeLocal(form.endLocal),
      meetLink: form.meetLink.trim() || null,
      locationLabel: form.locationLabel.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (repeat.endMode === "date") {
      payload.rangeEnd = repeat.rangeEnd || null;
    } else {
      payload.weekCount = repeat.weekCount;
    }
    return payload;
  };

  const validateForm = (): boolean => {
    if (!form.classroom?.id) {
      setError("Vui lòng chọn lớp học.");
      return false;
    }
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề buổi dạy.");
      return false;
    }
    if (!form.startLocal || !form.endLocal) {
      setError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return false;
    }
    if (repeat.enabled && !editing) {
      if (repeat.weekdays.length === 0) {
        setError("Chọn ít nhất một ngày lặp trong tuần.");
        return false;
      }
      if (repeat.endMode === "date" && !repeat.rangeEnd) {
        setError("Chọn ngày kết thúc chuỗi lặp.");
        return false;
      }
      if (repeat.endMode === "weeks" && repeat.weekCount < 1) {
        setError("Số tuần lặp phải ≥ 1.");
        return false;
      }
    }
    return true;
  };

  const performSave = async (scope?: RecurrenceScope) => {
    setSubmitting(true);
    setError("");
    try {
      if (editing?.id) {
        const payload = buildPayload();
        if (!payload) return;
        await apiUpdateClassSession(editing.id, payload, scope);
      } else if (repeat.enabled) {
        const payload = buildRecurringPayload();
        if (!payload) return;
        const result = await apiCreateRecurringClassSessions(payload);
        setSuccess(`Đã tạo ${result.createdCount} buổi dạy lặp tuần.`);
        onSaved();
        onClose();
        return;
      } else {
        const payload = buildPayload();
        if (!payload) return;
        await apiCreateClassSession(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể lưu buổi dạy.");
    } finally {
      setSubmitting(false);
      setScopeOpen(false);
    }
  };

  const submit = () => {
    if (!validateForm()) return;
    if (editing?.recurring) {
      setScopeMode("update");
      setScopeOpen(true);
      return;
    }
    void performSave();
  };

  const handleCancelSession = async (scope?: RecurrenceScope) => {
    if (!editing?.id) return;
    setCancelling(true);
    try {
      await apiCancelClassSession(editing.id, scope);
      setCancelOpen(false);
      setScopeOpen(false);
      onSaved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể hủy buổi dạy.");
      setCancelOpen(false);
      setScopeOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  const toggleWeekday = (day: number) => {
    setRepeat((prev) => {
      const has = prev.weekdays.includes(day);
      return {
        ...prev,
        weekdays: has ? prev.weekdays.filter((d) => d !== day) : [...prev.weekdays, day].sort(),
      };
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editing ? "Sửa buổi dạy" : "Lên lịch buổi dạy"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}
          {editing?.recurring ? (
            <Alert severity="info">Buổi này thuộc chuỗi lặp tuần. Sửa/hủy sẽ hỏi phạm vi áp dụng.</Alert>
          ) : null}

          <ClassroomPagingAutocomplete
            value={form.classroom}
            onChange={(val) => setForm((prev) => ({ ...prev, classroom: val as ClassroomRecord | null }))}
          />
          <TextField
            label="Tiêu đề buổi dạy"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            select
            label="Loại buổi"
            value={form.sessionType}
            onChange={(e) => setForm((prev) => ({ ...prev, sessionType: e.target.value as SessionType }))}
            fullWidth
            sx={muTextFieldSx}
          >
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <LessonPagingAutocomplete
            value={form.lesson}
            onChange={(lesson) => setForm((prev) => ({ ...prev, lesson }))}
            helperText="Gán bài dạy cho buổi học (tuỳ chọn)"
          />

          {!editing ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={repeat.enabled}
                  onChange={(e) => setRepeat((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Lặp lại hàng tuần"
            />
          ) : null}

          {repeat.enabled && !editing ? (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "var(--ac-surface-container-low)" }}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 700 }}>
                Ngày lặp trong tuần
              </FormLabel>
              <FormGroup row>
                {WEEKDAY_OPTIONS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={repeat.weekdays.includes(day.value)}
                        onChange={() => toggleWeekday(day.value)}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>

              <FormControl sx={{ mt: 2 }}>
                <FormLabel>Lặp đến</FormLabel>
                <RadioGroup
                  row
                  value={repeat.endMode}
                  onChange={(e) =>
                    setRepeat((prev) => ({ ...prev, endMode: e.target.value as "date" | "weeks" }))
                  }
                >
                  <FormControlLabel value="weeks" control={<Radio />} label="Số tuần" />
                  <FormControlLabel value="date" control={<Radio />} label="Ngày cụ thể" />
                </RadioGroup>
              </FormControl>

              {repeat.endMode === "weeks" ? (
                <TextField
                  label="Số tuần"
                  type="number"
                  value={repeat.weekCount}
                  onChange={(e) =>
                    setRepeat((prev) => ({ ...prev, weekCount: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  inputProps={{ min: 1, max: 52 }}
                  fullWidth
                  sx={{ ...muTextFieldSx, mt: 1 }}
                />
              ) : (
                <TextField
                  label="Ngày kết thúc"
                  type="date"
                  value={repeat.rangeEnd}
                  onChange={(e) => setRepeat((prev) => ({ ...prev, rangeEnd: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: extractDateFromDatetimeLocal(form.startLocal) || formatTodayIsoInTz() }}
                  sx={{ ...muTextFieldSx, mt: 1 }}
                />
              )}

              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--ac-on-surface-variant)" }}>
                Giờ mỗi buổi lấy từ &quot;Bắt đầu / Kết thúc&quot; bên dưới. Ngày bắt đầu chuỗi = ngày trong ô Bắt đầu.
              </Typography>
            </Box>
          ) : null}

          <TextField
            label={repeat.enabled && !editing ? "Bắt đầu (ngày + giờ mẫu)" : "Bắt đầu"}
            type="datetime-local"
            value={form.startLocal}
            onChange={(e) => setForm((prev) => ({ ...prev, startLocal: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={muTextFieldSx}
          />
          <TextField
            label={repeat.enabled && !editing ? "Kết thúc (giờ mẫu)" : "Kết thúc"}
            type="datetime-local"
            value={form.endLocal}
            onChange={(e) => setForm((prev) => ({ ...prev, endLocal: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={muTextFieldSx}
          />
          <TextField
            label="Link meet (Zoom / Google Meet)"
            value={form.meetLink}
            onChange={(e) => setForm((prev) => ({ ...prev, meetLink: e.target.value }))}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            label="Nhãn phòng / vị trí"
            placeholder="VD: Zoom Room A"
            value={form.locationLabel}
            onChange={(e) => setForm((prev) => ({ ...prev, locationLabel: e.target.value }))}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            label="Ghi chú"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            sx={muTextFieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ ...muDialogFooter, justifyContent: editing ? "space-between" : "flex-end" }}>
          {editing ? (
            <AppButton
              variant="outlined"
              color="error"
              onClick={() => {
                if (editing.recurring) {
                  setScopeMode("cancel");
                  setScopeOpen(true);
                } else {
                  setCancelOpen(true);
                }
              }}
              disabled={submitting || cancelling}
              sx={{ minWidth: 120 }}
            >
              Hủy buổi
            </AppButton>
          ) : (
            <span />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <AppButton variant="outlined" sx={muFooterBtnOutlined} onClick={onClose} disabled={submitting || cancelling}>
              Đóng
            </AppButton>
            <AppButton
              variant="contained"
              sx={muFooterBtnPrimary}
              onClick={() => void submit()}
              disabled={submitting || cancelling}
            >
              {submitting ? "Đang lưu…" : repeat.enabled && !editing ? "Tạo chuỗi lịch" : "Lưu"}
            </AppButton>
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        title="Hủy buổi dạy"
        content="Buổi dạy sẽ không còn hiển thị trên lịch. Bạn có chắc không?"
        cancelText="Không"
        confirmText="Hủy buổi"
        onClose={() => setCancelOpen(false)}
        onConfirm={() => void handleCancelSession()}
        loading={cancelling}
      />

      <RecurrenceScopeDialog
        open={scopeOpen}
        mode={scopeMode}
        onClose={() => setScopeOpen(false)}
        loading={submitting || cancelling}
        onConfirm={(scope) => {
          if (scopeMode === "cancel") {
            void handleCancelSession(scope);
          } else {
            void performSave(scope);
          }
        }}
      />
    </>
  );
}
