import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import { useCallback, useEffect, useState, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SendIcon from "@mui/icons-material/Send";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { apiGetClassrooms, type ClassroomRecord } from "../../../shared/api/classroom";
import {
  apiCreateExamAssignment,
  type ExamAssignmentFormPayload,
} from "../../../shared/api/examAssignment";
import type { ExamPaperRecord } from "../../../shared/api/examPaper";
import type { ApiResponse } from "../../../shared/api/types";

type ExamAssignToClassroomDialogProps = {
  open: boolean;
  paper: Pick<ExamPaperRecord, "id" | "title" | "status"> | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

function unwrapClassroomRows(response: unknown): ClassroomRecord[] {
  const payload = response as ApiResponse<{ result?: ClassroomRecord[] }> & {
    result?: ClassroomRecord[];
    data?: { result?: ClassroomRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

function localToIso(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function combineDateTime(dateStr: string, timeStr: string, defaultTime: string): string | null {
  if (!dateStr.trim()) return null;
  const time = timeStr.trim() || defaultTime;
  return `${dateStr}T${time}`;
}

export function ExamAssignToClassroomDialog({
  open,
  paper,
  onClose,
  onSuccess,
}: ExamAssignToClassroomDialogProps) {
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [classroomId, setClassroomId] = useState("");
  
  // Refs to trigger native pickers on icon clicks
  const openDateRef = useRef<HTMLInputElement>(null);
  const openTimeRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const dueTimeRef = useRef<HTMLInputElement>(null);
  const closeDateRef = useRef<HTMLInputElement>(null);
  const closeTimeRef = useRef<HTMLInputElement>(null);
  
  // Split date/time states
  const [openDate, setOpenDate] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [maxAttempts, setMaxAttempts] = useState(1);
  const [note, setNote] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Input focus tracking
  const [focusField, setFocusField] = useState<"open" | "due" | "close" | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);

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
    
    // Default open date/time to current local values
    setOpenDate(getTodayDateString());
    setOpenTime(getCurrentTimeString());
    
    setDueDate("");
    setDueTime("");
    setCloseDate("");
    setCloseTime("");
    setMaxAttempts(1);
    setNote("");
    setError("");
    void loadClassrooms();
  }, [open, loadClassrooms]);

  const handleSubmit = async () => {
    if (!paper?.id || !classroomId) {
      setError("Chọn lớp học để gán đề.");
      return;
    }
    if (paper.status !== "PUBLISHED") {
      setError("Chỉ gán được đề đã xuất bản (PUBLISHED).");
      return;
    }

    const openAtCombined = combineDateTime(openDate, openTime, "00:00");
    const dueAtCombined = combineDateTime(dueDate, dueTime, "23:59");
    const closeAtCombined = combineDateTime(closeDate, closeTime, "23:59");

    const payload: ExamAssignmentFormPayload = {
      examPaperId: paper.id,
      classroomId,
      openAt: openAtCombined ? localToIso(openAtCombined) : null,
      dueAt: dueAtCombined ? localToIso(dueAtCombined) : null,
      closeAt: closeAtCombined ? localToIso(closeAtCombined) : null,
      maxAttempts: Math.max(1, Math.min(10, maxAttempts || 1)),
      note: note.trim() || undefined,
    };

    setSubmitting(true);
    setError("");
    try {
      await apiCreateExamAssignment(payload);
      onSuccess(`Đã gán “${paper.title}” cho lớp.`);
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Gán đề thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="md"
      className="exam-assign-dialog"
    >
      <Box className="exam-assign-header">
        <Box className="exam-assign-header-left">
          <Typography variant="h6" className="exam-assign-title">
            Gán đề thi cho lớp
          </Typography>
          <Typography variant="body2" className="exam-assign-subtitle">
            Thiết lập thời gian và quy định làm bài cho học sinh
          </Typography>
        </Box>
        <IconButton
          className="exam-assign-close-btn"
          onClick={onClose}
          disabled={submitting}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent className="exam-assign-content">
        {error ? (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {error}
          </Alert>
        ) : null}

        {/* Section 1: ĐỀ THI */}
        {paper ? (
          <Box className="exam-assign-card exam-paper-info">
            <Box className="exam-assign-icon-wrapper blue">
              <AssignmentOutlinedIcon />
            </Box>
            <Box className="exam-assign-card-details">
              <Typography className="exam-assign-card-label">Đề thi</Typography>
              <Typography className="exam-assign-card-value">{paper.title}</Typography>
            </Box>
          </Box>
        ) : null}

        {/* Section 2: LỚP HỌC */}
        <Box className="exam-assign-card classroom-select">
          <Box className="exam-assign-icon-wrapper green">
            <PeopleOutlineIcon />
          </Box>
          <Box className="exam-assign-card-details">
            <Typography className="exam-assign-card-label" sx={{ mb: 0.5 }}>
              Lớp học
            </Typography>
            <Box className="exam-assign-select-wrapper">
              <TextField
                select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                disabled={loadingRooms || submitting}
                fullWidth
                size="small"
                SelectProps={{
                  displayEmpty: true,
                }}
              >
                <MenuItem value="">
                  <em>{loadingRooms ? "Đang tải…" : "Chọn lớp học..."}</em>
                </MenuItem>
                {classrooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                    {room.code ? ` (${room.code})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </Box>

        {/* Section 3: THỜI GIAN LÀM BÀI */}
        <Box className="exam-assign-card timeline-section">
          <Box className="exam-assign-card-header">
            <AccessTimeOutlinedIcon className="exam-assign-icon-wrapper purple" style={{ width: 28, height: 28, padding: 8 }} />
            <Typography className="exam-assign-card-title">Thời gian làm bài</Typography>
          </Box>

          {/* Timeline visualization */}
          <Box className="exam-timeline-visual">
            <Box className="exam-timeline-line" />

            <Box className="exam-timeline-step">
              <Box className="exam-timeline-dot green" />
              <Typography className="exam-timeline-step-title green">Mở làm bài</Typography>
              <Typography className="exam-timeline-step-desc">
                Học sinh có thể bắt đầu làm bài từ thời điểm này
              </Typography>
            </Box>

            <Box className="exam-timeline-step">
              <Box className="exam-timeline-dot orange" />
              <Typography className="exam-timeline-step-title orange">Hạn nộp</Typography>
              <Typography className="exam-timeline-step-desc">
                Học sinh cần hoàn thành và nộp bài trước thời điểm này
              </Typography>
            </Box>

            <Box className="exam-timeline-step">
              <Box className="exam-timeline-dot red" />
              <Typography className="exam-timeline-step-title red">Khóa bài</Typography>
              <Typography className="exam-timeline-step-desc">
                Sau thời điểm này, học sinh không thể bắt đầu hoặc tiếp tục làm bài
              </Typography>
            </Box>
          </Box>

          {/* Time inputs side-by-side */}
          <Box className="exam-time-inputs-grid">
            {/* Open At Date-Time Input */}
            <Box
              className={`exam-datetime-input-card green ${
                focusField === "open" ? "focus-within" : ""
              }`}
            >
              <CalendarTodayOutlinedIcon 
                className="exam-datetime-icon" 
                onClick={() => openDateRef.current?.showPicker()} 
              />
              <Box className="exam-time-picker-wrapper">
                <input
                  ref={openDateRef}
                  type="date"
                  className="exam-native-date-input"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("open")}
                  onBlur={() => setFocusField(null)}
                />
                <Box className="exam-datetime-divider" />
                <input
                  ref={openTimeRef}
                  type="time"
                  className="exam-native-time-input"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("open")}
                  onBlur={() => setFocusField(null)}
                />
              </Box>
              <AccessTimeIcon 
                className="exam-datetime-icon" 
                onClick={() => openTimeRef.current?.showPicker()} 
              />
            </Box>

            {/* Due At Date-Time Input */}
            <Box
              className={`exam-datetime-input-card orange ${
                focusField === "due" ? "focus-within" : ""
              }`}
            >
              <CalendarTodayOutlinedIcon 
                className="exam-datetime-icon" 
                onClick={() => dueDateRef.current?.showPicker()} 
              />
              <Box className="exam-time-picker-wrapper">
                <input
                  ref={dueDateRef}
                  type="date"
                  className="exam-native-date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("due")}
                  onBlur={() => setFocusField(null)}
                />
                <Box className="exam-datetime-divider" />
                <input
                  ref={dueTimeRef}
                  type="time"
                  className="exam-native-time-input"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("due")}
                  onBlur={() => setFocusField(null)}
                />
              </Box>
              <AccessTimeIcon 
                className="exam-datetime-icon" 
                onClick={() => dueTimeRef.current?.showPicker()} 
              />
            </Box>

            {/* Close At Date-Time Input */}
            <Box
              className={`exam-datetime-input-card red ${
                focusField === "close" ? "focus-within" : ""
              }`}
            >
              <CalendarTodayOutlinedIcon 
                className="exam-datetime-icon" 
                onClick={() => closeDateRef.current?.showPicker()} 
              />
              <Box className="exam-time-picker-wrapper">
                <input
                  ref={closeDateRef}
                  type="date"
                  className="exam-native-date-input"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("close")}
                  onBlur={() => setFocusField(null)}
                />
                <Box className="exam-datetime-divider" />
                <input
                  ref={closeTimeRef}
                  type="time"
                  className="exam-native-time-input"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  disabled={submitting}
                  onFocus={() => setFocusField("close")}
                  onBlur={() => setFocusField(null)}
                />
              </Box>
              <AccessTimeIcon 
                className="exam-datetime-icon" 
                onClick={() => closeTimeRef.current?.showPicker()} 
              />
            </Box>
          </Box>

          {/* Notice banner */}
          <Box className="exam-notice-banner">
            <InfoOutlinedIcon className="exam-notice-icon" />
            <Typography className="exam-notice-text">
              Để trống thời gian nếu bạn không muốn giới hạn.
            </Typography>
          </Box>
        </Box>

        {/* Section 4: QUY ĐỊNH LÀM BÀI */}
        <Box className="exam-assign-card rules-section">
          <Box className="exam-assign-card-header">
            <SettingsOutlinedIcon className="exam-assign-icon-wrapper blue" style={{ width: 28, height: 28, padding: 8 }} />
            <Typography className="exam-assign-card-title">Quy định làm bài</Typography>
          </Box>

          <Box className="exam-rules-grid">
            {/* Number of attempts */}
            <Box className="exam-rule-field-group">
              <Box className="exam-rule-label-row">
                <Typography className="exam-rule-label">Số lần làm tối đa</Typography>
                <Tooltip title="Học sinh chỉ được làm tối đa số lần này">
                  <HelpOutlineIcon className="exam-rule-info-icon" />
                </Tooltip>
              </Box>
              <Box className="exam-number-input-wrapper">
                <TextField
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                  disabled={submitting}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1, max: 10 }}
                />
              </Box>
            </Box>

            {/* Note/instructions */}
            <Box className="exam-rule-field-group">
              <Typography className="exam-rule-label">Ghi chú cho học sinh (tùy chọn)</Typography>
              <Box className="exam-textarea-wrapper">
                <Box className={`exam-textarea-container ${noteFocused ? "focus-within" : ""}`}>
                  <textarea
                    placeholder="Nhập ghi chú hoặc hướng dẫn thêm cho học sinh..."
                    className="exam-custom-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 255))}
                    disabled={submitting}
                    onFocus={() => setNoteFocused(true)}
                    onBlur={() => setNoteFocused(false)}
                  />
                </Box>
                <Typography className="exam-textarea-counter">
                  {note.length}/255
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="exam-assign-footer">
        <Button onClick={onClose} disabled={submitting} className="exam-btn-cancel">
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={submitting || !classroomId || paper?.status !== "PUBLISHED"}
          className="exam-btn-submit"
        >
          <SendIcon fontSize="small" style={{ transform: "rotate(-25deg)", marginTop: -2 }} />
          {submitting ? "Đang gán…" : "Gán đề cho lớp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

