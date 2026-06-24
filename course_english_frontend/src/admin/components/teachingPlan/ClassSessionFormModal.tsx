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
import { AppDateTimePicker, AppTimePicker } from "../../../shared/datetime";
import {
  addMinutesToDatetimeLocal,
  buildSessionTimes,
  datetimeLocalToIso,
  extractDateFromDatetimeLocal,
  extractTimeFromDatetimeLocal,
  formatIsoDateVi,
  formatTodayIsoInTz,
  isoToDatetimeLocal,
  isSessionEndTimeAfterStart,
  mergeDateWithTime,
  mergeDayWithTimeHHmm,
  recurringRangeEndDate,
  SESSION_DEFAULT_DURATION_MIN,
  SESSION_LONG_DURATION_MIN,
  SESSION_TYPE_OPTIONS,
  sessionDurationMinutes,
  syncSessionEndOnStartDay,
  WEEKDAY_OPTIONS,
} from "./teachingPlanUtils";
import { meetLinkValidationMessage } from "./meetLinkUtils";
import { formatDaySectionLabel } from "./weekScheduleUtils";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

type ClassSessionFormMode = "quick" | "recurring";

type ClassSessionFormModalProps = {
  open: boolean;
  editing: ClassSessionRecord | null;
  mode?: ClassSessionFormMode;
  initialDay?: string;
  initialStartHour?: number;
  initialStartMinute?: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type FormState = {
  classroom: ClassroomRecord | null;
  lesson: LessonRecord | null;
  title: string;
  sessionType: SessionType;
  startLocal: string;
  endLocal: string;
  meetLink: string;
  usePreSavedLink: boolean;
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
  usePreSavedLink: false,
  locationLabel: "",
  notes: "",
};

const defaultRepeat: RepeatState = {
  enabled: false,
  weekdays: [1, 3],
  endMode: "weeks",
  rangeEnd: "",
  weekCount: 4,
};

function buildDialogTitle(
  editing: ClassSessionRecord | null,
  mode: ClassSessionFormMode,
  initialDay?: string,
): string {
  if (editing) return "Sửa ca dạy";
  if (mode === "recurring") return "Thiết lập lịch cố định";
  if (initialDay) return `Thêm ca dạy — ${formatDaySectionLabel(initialDay)}`;
  return "Thêm ca hôm nay";
}

export function ClassSessionFormModal({
  open,
  editing,
  mode = "quick",
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

  const isRecurringMode = !editing && mode === "recurring";
  const isQuickWithFixedDay = !editing && mode === "quick" && Boolean(initialDay);
  const fixedDay = initialDay ?? (isQuickWithFixedDay ? extractDateFromDatetimeLocal(form.startLocal) : undefined);
  const isLiveClass = form.sessionType === "LIVE_CLASS";
  const showMeetLinkField = !isLiveClass || form.usePreSavedLink;
  const durationMinutes =
    form.startLocal && form.endLocal
      ? sessionDurationMinutes(datetimeLocalToIso(form.startLocal), datetimeLocalToIso(form.endLocal))
      : 0;
  const showLongSessionWarning = durationMinutes > SESSION_LONG_DURATION_MIN;

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
        usePreSavedLink: Boolean(editing.usePreSavedLink || editing.meetLink),
        locationLabel: editing.locationLabel ?? "",
        notes: editing.notes ?? "",
      });
      setRepeat({ ...defaultRepeat, enabled: false });
    } else if (mode === "recurring") {
      const { startLocal, endLocal } = buildSessionTimes(formatTodayIsoInTz());
      setForm({
        ...defaultForm,
        startLocal,
        endLocal,
      });
      setRepeat({
        ...defaultRepeat,
        enabled: true,
        rangeEnd: recurringRangeEndDate(extractDateFromDatetimeLocal(startLocal), defaultRepeat.weekCount),
      });
    } else {
      const { startLocal, endLocal } = buildSessionTimes(initialDay, initialStartHour, initialStartMinute);
      setForm({
        ...defaultForm,
        startLocal,
        endLocal,
      });
      setRepeat({ ...defaultRepeat, enabled: false });
    }
  }, [open, editing, mode, initialDay, initialStartHour, initialStartMinute]);

  const handleQuickStartTimeChange = (startTime: string) => {
    const day = fixedDay ?? extractDateFromDatetimeLocal(form.startLocal);
    if (!day || !startTime.trim()) return;
    const startLocal = mergeDayWithTimeHHmm(day, startTime);
    setForm((prev) => {
      let endLocal = prev.endLocal;
      if (
        endLocal &&
        new Date(datetimeLocalToIso(endLocal)).getTime() <= new Date(datetimeLocalToIso(startLocal)).getTime()
      ) {
        endLocal = addMinutesToDatetimeLocal(startLocal, SESSION_DEFAULT_DURATION_MIN);
      }
      return { ...prev, startLocal, endLocal };
    });
  };

  const handleQuickEndTimeChange = (endTime: string) => {
    if (!endTime.trim()) return;
    setForm((prev) => ({
      ...prev,
      endLocal: syncSessionEndOnStartDay(prev.startLocal, endTime),
    }));
  };

  const handleStartLocalChange = (startLocal: string) => {
    setForm((prev) => {
      let endLocal = prev.endLocal;
      if (isRecurringMode) {
        endLocal = syncSessionEndOnStartDay(startLocal, prev.endLocal);
      } else if (
        endLocal &&
        new Date(datetimeLocalToIso(endLocal)).getTime() <= new Date(datetimeLocalToIso(startLocal)).getTime()
      ) {
        endLocal = addMinutesToDatetimeLocal(startLocal, SESSION_DEFAULT_DURATION_MIN);
      }
      return { ...prev, startLocal, endLocal };
    });
    if (isRecurringMode && startLocal) {
      const rangeEnd = recurringRangeEndDate(extractDateFromDatetimeLocal(startLocal), repeat.weekCount);
      setRepeat((prev) => ({ ...prev, rangeEnd }));
    }
  };

  const handleSessionEndTimeChange = (endTime: string) => {
    setForm((prev) => ({
      ...prev,
      endLocal: syncSessionEndOnStartDay(prev.startLocal, endTime),
    }));
  };

  const handleWeekCountChange = (weekCount: number) => {
    const safe = Math.max(1, weekCount);
    setRepeat((prev) => {
      const rangeEnd = form.startLocal
        ? recurringRangeEndDate(extractDateFromDatetimeLocal(form.startLocal), safe)
        : prev.rangeEnd;
      return { ...prev, weekCount: safe, rangeEnd };
    });
  };

  const resolveTitle = (): string =>
    form.title.trim() || form.classroom?.name?.trim() || form.classroom?.code?.trim() || "";

  const resolveMeetLinkForPayload = (): string | null => {
    if (form.sessionType === "LIVE_CLASS") {
      if (!form.usePreSavedLink) return null;
      return form.meetLink.trim() || null;
    }
    return form.meetLink.trim() || null;
  };

  const buildPayload = (): ClassSessionPayload | null => {
    const classroom = form.classroom;
    const title = resolveTitle();
    if (!classroom?.id || !title || !form.startLocal || !form.endLocal) return null;
    return {
      classroomId: classroom.id,
      lessonId: form.lesson?.id ?? null,
      title,
      sessionType: form.sessionType,
      startAt: datetimeLocalToIso(form.startLocal),
      endAt: datetimeLocalToIso(form.endLocal),
      meetLink: resolveMeetLinkForPayload(),
      locationLabel: form.locationLabel.trim() || null,
      notes: form.notes.trim() || null,
    };
  };

  const buildRecurringPayload = (): RecurringClassSessionPayload | null => {
    const classroom = form.classroom;
    const title = resolveTitle();
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
      meetLink: resolveMeetLinkForPayload(),
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
    if (!resolveTitle()) {
      setError("Vui lòng nhập tiêu đề ca dạy hoặc chọn lớp có tên.");
      return false;
    }
    if (!form.startLocal || !form.endLocal) {
      setError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return false;
    }
    if (isQuickWithFixedDay) {
      const startTime = extractTimeFromDatetimeLocal(form.startLocal);
      const endTime = extractTimeFromDatetimeLocal(form.endLocal);
      if (!isSessionEndTimeAfterStart(startTime, endTime)) {
        setError("Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.");
        return false;
      }
    } else if (
      !isRecurringMode &&
      new Date(datetimeLocalToIso(form.endLocal)).getTime() <= new Date(datetimeLocalToIso(form.startLocal)).getTime()
    ) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return false;
    }
    if (isRecurringMode) {
      if (repeat.weekdays.length === 0) {
        setError("Chọn ít nhất một ngày lặp trong tuần.");
        return false;
      }
      const startTime = extractTimeFromDatetimeLocal(form.startLocal);
      const endTime = extractTimeFromDatetimeLocal(form.endLocal);
      if (!isSessionEndTimeAfterStart(startTime, endTime)) {
        setError("Giờ kết thúc mỗi ca phải sau giờ bắt đầu (ví dụ 11:30 → 12:20).");
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
    const meetLink = resolveMeetLinkForPayload();
    if (meetLink) {
      const linkError = meetLinkValidationMessage(meetLink);
      if (linkError) {
        setError(linkError);
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
        if (!payload) {
          setError("Không thể tạo dữ liệu lưu. Kiểm tra lớp, tiêu đề và thời gian.");
          return;
        }
        await apiUpdateClassSession(editing.id, payload, scope);
      } else if (isRecurringMode) {
        const payload = buildRecurringPayload();
        if (!payload) {
          setError("Không thể tạo chuỗi lịch. Kiểm tra lớp, tiêu đề, thời gian và ngày lặp.");
          return;
        }
        const result = await apiCreateRecurringClassSessions(payload);
        setSuccess(`Đã tạo ${result.createdCount} ca dạy lặp tuần.`);
        await onSaved();
        onClose();
        return;
      } else {
        const payload = buildPayload();
        if (!payload) {
          setError("Không thể tạo dữ liệu lưu. Kiểm tra lớp, tiêu đề và thời gian.");
          return;
        }
        await apiCreateClassSession(payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể lưu ca dạy.");
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
      await onSaved();
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
        <DialogTitle>{buildDialogTitle(editing, mode, initialDay)}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}
          {editing?.recurring ? (
            <Alert severity="info">Ca này thuộc chuỗi lặp tuần. Sửa/hủy sẽ hỏi phạm vi áp dụng.</Alert>
          ) : null}
          {isRecurringMode ? (
            <Alert severity="info">
              Tạo nhiều ca cùng giờ theo các thứ trong tuần — phù hợp lịch cố định cả tháng/học kỳ.
            </Alert>
          ) : null}

          <ClassroomPagingAutocomplete
            value={form.classroom}
            onChange={(val) => setForm((prev) => ({ ...prev, classroom: val as ClassroomRecord | null }))}
          />
          <TextField
            label="Tiêu đề ca dạy"
            placeholder="Để trống sẽ dùng tên lớp"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
            sx={muTextFieldSx}
          />
          <TextField
            select
            label="Loại buổi"
            value={form.sessionType}
            onChange={(e) => {
              const sessionType = e.target.value as SessionType;
              setForm((prev) => ({
                ...prev,
                sessionType,
                usePreSavedLink: sessionType === "LIVE_CLASS" ? prev.usePreSavedLink : false,
                meetLink: sessionType === "LIVE_CLASS" ? prev.meetLink : prev.meetLink,
              }));
            }}
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

          {isRecurringMode ? (
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
                  onChange={(e) => handleWeekCountChange(Number(e.target.value) || 1)}
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

              {form.startLocal ? (
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--ac-on-surface-variant)" }}>
                  Ngày cuối chuỗi:{" "}
                  <strong>
                    {formatIsoDateVi(
                      repeat.endMode === "date" && repeat.rangeEnd
                        ? repeat.rangeEnd
                        : recurringRangeEndDate(
                            extractDateFromDatetimeLocal(form.startLocal),
                            repeat.weekCount,
                          ),
                    )}
                  </strong>
                </Typography>
              ) : null}

              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "var(--ac-on-surface-variant)" }}>
                Giờ mỗi buổi: lấy từ ô Bắt đầu và Giờ kết thúc bên dưới (cùng một ngày, không tính ngày cuối chuỗi).
              </Typography>
            </Box>
          ) : null}

          {isRecurringMode ? (
            <>
              <AppDateTimePicker
                label="Bắt đầu từ (ngày + giờ mẫu)"
                value={form.startLocal}
                onChange={handleStartLocalChange}
                sx={muTextFieldSx}
              />
              <AppTimePicker
                label="Giờ kết thúc mỗi ca"
                value={extractTimeFromDatetimeLocal(form.endLocal)}
                onChange={handleSessionEndTimeChange}
                sx={muTextFieldSx}
              />
            </>
          ) : isQuickWithFixedDay ? (
            <>
              <Typography variant="body2" sx={{ color: "var(--ac-on-surface-variant)", fontWeight: 600 }}>
                Ngày: {formatDaySectionLabel(fixedDay!)}
              </Typography>
              <AppTimePicker
                label="Giờ bắt đầu"
                value={extractTimeFromDatetimeLocal(form.startLocal)}
                onChange={handleQuickStartTimeChange}
                sx={muTextFieldSx}
              />
              <AppTimePicker
                label="Giờ kết thúc"
                value={extractTimeFromDatetimeLocal(form.endLocal)}
                onChange={handleQuickEndTimeChange}
                sx={muTextFieldSx}
              />
            </>
          ) : (
            <>
              <AppDateTimePicker
                label="Bắt đầu"
                value={form.startLocal}
                onChange={handleStartLocalChange}
                sx={muTextFieldSx}
              />
              <AppDateTimePicker
                label="Kết thúc"
                value={form.endLocal}
                onChange={(endLocal) => setForm((prev) => ({ ...prev, endLocal }))}
                minDateTime={form.startLocal}
                sx={muTextFieldSx}
              />
            </>
          )}
          {showLongSessionWarning ? (
            <Alert severity="warning">
              Buổi học khoảng {durationMinutes} phút. Google Meet miễn phí thường giới hạn ~60 phút/phiên — cân
              nhắc rút ngắn hoặc chia ca.
            </Alert>
          ) : null}
          {isLiveClass ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.usePreSavedLink}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      usePreSavedLink: e.target.checked,
                      meetLink: e.target.checked ? prev.meetLink : "",
                    }))
                  }
                />
              }
              label="Dùng link có sẵn (Zoom / Meet cố định)"
            />
          ) : null}
          {showMeetLinkField ? (
            <TextField
              label={isLiveClass ? "Link meet có sẵn" : "Link meet (tuỳ chọn)"}
              placeholder="https://meet.google.com/... hoặc https://zoom.us/j/..."
              value={form.meetLink}
              onChange={(e) => setForm((prev) => ({ ...prev, meetLink: e.target.value }))}
              fullWidth
              sx={muTextFieldSx}
            />
          ) : isLiveClass ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Lớp trực tuyến: bấm <strong>Bắt đầu lớp online</strong> đúng giờ để tạo phòng Meet và dán link.
            </Alert>
          ) : null}
          {/* Tạm ẩn — nhãn phòng/vị trí chưa dùng rõ trên UI
          <TextField
            label="Nhãn phòng / vị trí"
            placeholder="VD: Zoom Room A"
            value={form.locationLabel}
            onChange={(e) => setForm((prev) => ({ ...prev, locationLabel: e.target.value }))}
            fullWidth
            sx={muTextFieldSx}
          />
          */}
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
              Hủy ca
            </AppButton>
          ) : (
            <span />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <AppButton variant="outlined" sx={muFooterBtnOutlined} onClick={onClose} disabled={submitting || cancelling}>
              Đóng
            </AppButton>
            <AppButton
              type="button"
              variant="contained"
              sx={muFooterBtnPrimary}
              onClick={() => void submit()}
              disabled={submitting || cancelling}
            >
              {submitting ? "Đang lưu…" : isRecurringMode ? "Tạo chuỗi lịch" : "Lưu ca"}
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
