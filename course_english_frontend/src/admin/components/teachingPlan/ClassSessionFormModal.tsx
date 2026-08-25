import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImportContactsOutlinedIcon from "@mui/icons-material/ImportContactsOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LaptopMacOutlinedIcon from "@mui/icons-material/LaptopMacOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EastIcon from "@mui/icons-material/East";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import VideoCameraFrontOutlinedIcon from "@mui/icons-material/VideoCameraFrontOutlined";
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
import { AppTimePicker } from "../../../shared/datetime";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dayjs } from "../../../shared/datetime/dayjsConfig";
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
  recurringRangeEndDate,
  SESSION_DEFAULT_DURATION_MIN,
  SESSION_LONG_DURATION_MIN,
  SESSION_TYPE_OPTIONS,
  sessionDurationMinutes,
  WEEKDAY_OPTIONS,
} from "./teachingPlanUtils";
import { meetLinkValidationMessage } from "./meetLinkUtils";
import { formatDaySectionLabel } from "./weekScheduleUtils";
import { muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";

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

  const handleDateOnlyChange = (newDateIso: string) => {
    if (!newDateIso) return;
    setForm((prev) => {
      const startTime = prev.startLocal ? extractTimeFromDatetimeLocal(prev.startLocal) : "10:00";
      const endTime = prev.endLocal ? extractTimeFromDatetimeLocal(prev.endLocal) : "12:00";
      const startLocal = mergeDateWithTime(newDateIso, startTime);
      const endLocal = mergeDateWithTime(newDateIso, endTime);
      return { ...prev, startLocal, endLocal };
    });
    if (isRecurringMode && form.startLocal) {
      const rangeEnd = recurringRangeEndDate(newDateIso, repeat.weekCount);
      setRepeat((prev) => ({ ...prev, rangeEnd }));
    }
  };

  const handleStartTimeChange = (newTime: string) => {
    if (!newTime) return;
    setForm((prev) => {
      const date = extractDateFromDatetimeLocal(prev.startLocal) || formatTodayIsoInTz();
      // AppTimePicker trả về dạng HH:mm, không có 'T' => ghép trực tiếp để tránh bị fallback sai.
      const startLocal = `${date}T${newTime.slice(0, 5)}`;
      // Theo yêu cầu: đổi giờ bắt đầu thì giờ kết thúc tự theo cấu hình (duration mặc định).
      // Nếu duration tràn sang ngày hôm sau thì cap lại ở 23:59 cùng ngày để tránh wrap lệch.
      const candidate = addMinutesToDatetimeLocal(startLocal, SESSION_DEFAULT_DURATION_MIN);
      const candidateDate = extractDateFromDatetimeLocal(candidate);
      const endLocal = candidateDate !== date ? `${date}T23:59` : candidate;
      return { ...prev, startLocal, endLocal };
    });
  };

  const handleEndTimeChange = (newTime: string) => {
    if (!newTime) return;
    setForm((prev) => {
      const date = extractDateFromDatetimeLocal(prev.startLocal) || formatTodayIsoInTz();
      // AppTimePicker trả về dạng HH:mm, không có 'T' => ghép trực tiếp.
      const endLocal = `${date}T${newTime.slice(0, 5)}`;
      return { ...prev, endLocal };
    });
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

  const typeIcon = (() => {
    switch (form.sessionType) {
      case "LIVE_CLASS":
        return <LaptopMacOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />;
      case "OFFICE_HOURS":
        return <AccessTimeOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />;
      case "EXAM":
        return <DescriptionOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />;
      default:
        return <DescriptionOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />;
    }
  })();

  const capitalizeFirstLetter = (val: string) => {
    if (!val) return "";
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "session-modal-paper",
          sx: { maxWidth: "1000px !important", width: "100%" },
        }}
      >
        <Box className="session-dialog-header">
          <Box className="session-header-badge">
            <CalendarMonthOutlinedIcon />
          </Box>
          <Box className="session-header-title-wrap" sx={{ flexGrow: 1 }}>
            <Typography className="session-header-title">
              {editing ? "Sửa ca dạy" : mode === "recurring" ? "Thiết lập lịch cố định" : "Thêm ca dạy"}
            </Typography>
            <Typography className="session-header-subtitle">
              {editing
                ? formatDaySectionLabel(extractDateFromDatetimeLocal(form.startLocal) || "")
                : initialDay
                ? formatDaySectionLabel(initialDay)
                : formatDaySectionLabel(formatTodayIsoInTz())}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "#64748b" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          {(error || success || editing?.recurring || isRecurringMode) && (
            <Box sx={{ p: 2, pb: 0, display: "flex", flexDirection: "column", gap: 1 }}>
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
            </Box>
          )}

          <Box className="session-modal-container">
            {/* Left Main Form Column */}
            <Box className="session-modal-main">
              {/* 1. Lớp học */}
              <Box className="session-section-card">
                <Box className="session-section-header">
                  <Box className="session-section-icon">
                    <ImportContactsOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography className="session-section-title">1. Lớp học</Typography>
                </Box>
                <ClassroomPagingAutocomplete
                  value={form.classroom}
                  onChange={(val) => setForm((prev) => ({ ...prev, classroom: val as ClassroomRecord | null }))}
                  startIcon={<ImportContactsOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />}
                />
              </Box>

              {/* 2. Nội dung buổi học */}
              <Box className="session-section-card">
                <Box className="session-section-header">
                  <Box className="session-section-icon">
                    <MenuBookOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography className="session-section-title">2. Nội dung buổi học</Typography>
                </Box>
                
                <TextField
                  label="Tiêu đề buổi học"
                  placeholder="Để trống sẽ dùng tên lớp"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  sx={muTextFieldSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <BorderColorOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />
                      ),
                    },
                  }}
                />

                <Box className="session-grid-row">
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
                    slotProps={{
                      input: {
                        startAdornment: typeIcon,
                      },
                    }}
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
                    startIcon={<DescriptionOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />}
                  />
                </Box>
              </Box>

              {/* 3. Thời gian */}
              <Box className="session-section-card">
                <Box className="session-section-header">
                  <Box className="session-section-icon">
                    <AccessTimeOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography className="session-section-title">3. Thời gian</Typography>
                </Box>

                {isRecurringMode ? (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "var(--ac-surface-container-low)", display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>
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

                    <FormControl>
                      <FormLabel sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", mb: 0.5 }}>Lặp đến</FormLabel>
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
                        sx={muTextFieldSx}
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
                        sx={muTextFieldSx}
                      />
                    )}

                    {form.startLocal ? (
                      <Typography variant="caption" sx={{ display: "block", color: "var(--ac-on-surface-variant)", fontWeight: 600 }}>
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
                  </Box>
                ) : null}

                <DatePicker
                  label={isRecurringMode ? "Bắt đầu từ" : "Ngày dạy"}
                  value={form.startLocal ? dayjs(form.startLocal) : null}
                  onChange={(next) => {
                    if (next && next.isValid()) {
                      handleDateOnlyChange(next.format("YYYY-MM-DD"));
                    }
                  }}
                  disabled={Boolean(editing)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: muTextFieldSx,
                      InputProps: {
                        startAdornment: (
                          <CalendarMonthOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />
                        ),
                      },
                    },
                  }}
                />

                <Box className="session-time-grid-row">
                  <AppTimePicker
                    label="Giờ bắt đầu"
                    value={form.startLocal ? extractTimeFromDatetimeLocal(form.startLocal) : ""}
                    onChange={handleStartTimeChange}
                    sx={muTextFieldSx}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EastIcon sx={{ color: "#94a3b8" }} />
                  </Box>
                  <AppTimePicker
                    label="Giờ kết thúc"
                    value={form.endLocal ? extractTimeFromDatetimeLocal(form.endLocal) : ""}
                    onChange={handleEndTimeChange}
                    sx={muTextFieldSx}
                  />
                </Box>

                <Box className="session-time-banner">
                  <Box className="session-time-banner-item">
                    <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
                    <span>Thời lượng: {durationMinutes} phút</span>
                  </Box>
                  {showLongSessionWarning ? (
                    <Box className="session-time-banner-item">
                      <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                      <span>Google Meet miễn phí thường giới hạn ~60 phút/phiên — cân nhắc rút ngắn hoặc chia ca.</span>
                    </Box>
                  ) : null}
                </Box>
              </Box>

              {/* 4. Hình thức & liên kết */}
              <Box className="session-section-card">
                <Box className="session-section-header">
                  <Box className="session-section-icon">
                    <LinkOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography className="session-section-title">4. Hình thức & liên kết</Typography>
                </Box>

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
                    label={isLiveClass ? "Link Meet / Zoom có sẵn" : "Link học trực tuyến (tùy chọn)"}
                    placeholder="Nhập link Meet hoặc Zoom tại đây..."
                    value={form.meetLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, meetLink: e.target.value }))}
                    fullWidth
                    sx={muTextFieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <LinkOutlinedIcon sx={{ color: "#6366f1", mr: 1, fontSize: 18 }} />
                        ),
                      },
                    }}
                  />
                ) : isLiveClass ? (
                  <Alert severity="info" sx={{ py: 0.5, borderRadius: "10px" }}>
                    Lớp trực tuyến: đến giờ bấm <strong>Bắt đầu lớp online</strong> để tạo phòng Meet và dán link.
                  </Alert>
                ) : null}
              </Box>

              {/* 5. Ghi chú (tùy chọn) */}
              <Box className="session-section-card">
                <Box className="session-section-header">
                  <Box className="session-section-icon">
                    <NotesOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography className="session-section-title">5. Ghi chú (tùy chọn)</Typography>
                </Box>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    placeholder="Nhập ghi chú cho buổi học (nếu có)..."
                    value={form.notes}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setForm((prev) => ({ ...prev, notes: e.target.value }));
                      }
                    }}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={muTextFieldSx}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 12,
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    {form.notes.length}/300
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Sidebar Summary Column */}
            <Box className="session-modal-sidebar">
              <Box className="session-sidebar-card">
                <Typography className="session-sidebar-title">Tóm tắt ca dạy</Typography>
                
                <Box className="session-summary-list">
                  {/* Lớp học */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon class">
                      <ImportContactsOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Lớp học</Typography>
                      <Typography className="session-summary-value">
                        {form.classroom?.name || "Chưa chọn"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tiêu đề */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon title">
                      <BorderColorOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Tiêu đề</Typography>
                      <Typography className="session-summary-value">
                        {form.title.trim() || form.classroom?.name || "Chưa nhập"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Loại buổi */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon type">
                      <LaptopMacOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Loại buổi</Typography>
                      <Typography className="session-summary-value">
                        {SESSION_TYPE_OPTIONS.find((o) => o.value === form.sessionType)?.label || form.sessionType}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bài học */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon lesson">
                      <DescriptionOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Bài học</Typography>
                      <Typography className="session-summary-value">
                        {form.lesson?.title || "Chưa gán"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Thời gian */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon time">
                      <AccessTimeOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Thời gian</Typography>
                      <Typography className="session-summary-value" sx={{ color: "#16a34a !important" }}>
                        {form.startLocal
                          ? capitalizeFirstLetter(dayjs(form.startLocal).format("dddd, DD/MM/YYYY"))
                          : "Chưa chọn"}
                        {form.startLocal && form.endLocal ? (
                          <>
                            <br />
                            {extractTimeFromDatetimeLocal(form.startLocal)} - {extractTimeFromDatetimeLocal(form.endLocal)} ({durationMinutes} phút)
                          </>
                        ) : null}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Hình thức */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon method">
                      <VideoCameraFrontOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Hình thức</Typography>
                      <Typography className="session-summary-value" sx={{ color: "#ea580c !important" }}>
                        {form.sessionType === "LIVE_CLASS"
                          ? form.usePreSavedLink
                            ? "Meet/Zoom có sẵn"
                            : "Tạo Meet khi bắt đầu lớp"
                          : "Không dùng Meet"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ghi chú */}
                  <Box className="session-summary-item">
                    <Box className="session-summary-icon notes">
                      <NotesOutlinedIcon fontSize="small" />
                    </Box>
                    <Box className="session-summary-content">
                      <Typography className="session-summary-label">Ghi chú</Typography>
                      <Typography className="session-summary-value">
                        {form.notes.trim() || "Không có"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: "16px 24px !important",
            borderTop: "1px solid #f1f5f9 !important",
            bgcolor: "#ffffff !important",
            justifyContent: editing ? "space-between" : "flex-end",
          }}
        >
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
              sx={{ borderRadius: "10px !important", textTransform: "none", fontWeight: 700 }}
            >
              Hủy ca này
            </AppButton>
          ) : (
            <span />
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <AppButton
              variant="outlined"
              className="session-footer-cancel"
              onClick={onClose}
              disabled={submitting || cancelling}
            >
              Hủy
            </AppButton>
            <AppButton
              type="button"
              variant="contained"
              className="session-footer-save"
              startIcon={<SaveOutlinedIcon />}
              onClick={() => void submit()}
              disabled={submitting || cancelling}
            >
              {submitting ? "Đang lưu…" : isRecurringMode ? "Tạo chuỗi lịch" : "Lưu ca dạy"}
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
