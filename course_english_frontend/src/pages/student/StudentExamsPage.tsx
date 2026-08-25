import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiListStudentExams,
  type StudentExamAssignmentRecord,
} from "../../shared/api/studentExam";
import { studentRoutePaths } from "../../shared/constants/paths";
import "../../styles/student-exams.css";

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

export function StudentExamsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<StudentExamAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tab filter state
  const [activeTab, setActiveTab] = useState<"ALL" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "OVERDUE">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiListStudentExams();
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setRows([]);
      setError((err as { message?: string })?.message || "Không tải được danh sách đề.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Filter rows based on selected tab chip
  const filteredRows = rows.filter((row) => {
    const isOverdue = !row.latestSubmittedAttempt && !row.inProgressAttempt && !row.canStart && !row.windowOpen && row.dueAt && new Date(row.dueAt) < new Date();
    
    if (activeTab === "ALL") return true;
    if (activeTab === "NOT_STARTED") {
      return !!row.canStart && !row.inProgressAttempt && !row.latestSubmittedAttempt && !!row.windowOpen;
    }
    if (activeTab === "IN_PROGRESS") {
      return !!row.inProgressAttempt;
    }
    if (activeTab === "SUBMITTED") {
      return !!row.latestSubmittedAttempt;
    }
    if (activeTab === "OVERDUE") {
      return isOverdue || (!row.latestSubmittedAttempt && row.dueAt && new Date(row.dueAt) < new Date());
    }
    return true;
  });

  return (
    <Box className="student-exams-container">
      {/* Header Banner Block */}
      <Box className="student-exams-banner">
        <Box className="student-exams-banner-left">
          <Box className="student-exams-banner-icon">
            <AssignmentOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h5" className="student-exams-banner-title">
              Đề thi / Kiểm tra
            </Typography>
            <Typography variant="body2" className="student-exams-banner-subtitle">
              Các đề giáo viên giao cho lớp của bạn.
            </Typography>
          </Box>
        </Box>
        <Box className="student-exams-banner-right">
          {/* SVG Vector illustration matching checklist clipboard & clock in prototype */}
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="45" r="40" fill="#f5f3ff" />
            <rect x="42" y="10" width="36" height="52" rx="6" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
            <path d="M54 7C54 5.89543 54.8954 5 56 5H64C65.1046 5 66 5.89543 66 7V10H54V7Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.5" />
            
            {/* Checklist Lines */}
            <line x1="50" y1="22" x2="68" y2="22" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="30" x2="68" y2="30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="38" x2="68" y2="38" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="46" x2="68" y2="46" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            
            {/* Checkmarks */}
            <path d="M47 21.5L48.5 23L51.5 20" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M47 29.5L48.5 31L51.5 28" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M47 37.5L48.5 39L51.5 36" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Clock Overlay bottom right */}
            <circle cx="78" cy="54" r="14" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
            <path d="M78 46V54H84" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {/* Filter Tabs Row */}
      <Box className="student-exams-tabs">
        {[
          { id: "ALL", label: "Tất cả" },
          { id: "NOT_STARTED", label: "Chưa làm" },
          { id: "IN_PROGRESS", label: "Đang làm" },
          { id: "SUBMITTED", label: "Đã nộp" },
          { id: "OVERDUE", label: "Quá hạn" },
        ].map((tab) => (
          <Button
            key={tab.id}
            className={`student-exams-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Box className="student-exams-empty">
          Chưa có đề thi nào trong mục này.
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {filteredRows.map((row) => {
            const due = row.dueAt ? formatWhen(row.dueAt) : null;
            const canEnter =
              Boolean(row.canStart) || Boolean(row.inProgressAttempt) || Boolean(row.latestSubmittedAttempt);
            const cta = row.inProgressAttempt
              ? "Tiếp tục làm"
              : row.canStart
                ? "Làm đề"
                : row.latestSubmittedAttempt
                  ? "Xem kết quả"
                  : row.windowOpen
                    ? "Hết lượt"
                    : "Ngoài giờ";

            return (
              <Box key={row.id} className="student-exam-card">
                <Box className="student-exam-card-main">
                  <Box className="student-exam-card-left">
                    <Box className="student-exam-card-icon-box">
                      <AssignmentOutlinedIcon />
                    </Box>
                    <Box className="student-exam-card-details">
                      <Typography className="student-exam-card-title">
                        {row.examPaperTitle ?? "Đề thi"}
                      </Typography>
                      
                      <Box className="student-exam-card-meta">
                        <Box className="student-exam-meta-item">
                          <PeopleOutlineIcon fontSize="inherit" />
                          <Typography component="span">{row.classroomName ?? "Lớp"}</Typography>
                        </Box>
                        <Box className="student-exam-meta-divider" />
                        <Typography component="span">{row.questionCount ?? 0} câu</Typography>
                        
                        {row.durationMinutes ? (
                          <>
                            <Box className="student-exam-meta-divider" />
                            <Typography component="span">{row.durationMinutes} phút</Typography>
                          </>
                        ) : null}
                        
                        {due ? (
                          <>
                            <Box className="student-exam-meta-divider" />
                            <Box className="student-exam-meta-item deadline">
                              <AccessTimeOutlinedIcon fontSize="inherit" />
                              <Typography component="span" fontWeight={600}>
                                Hạn: {due}
                              </Typography>
                            </Box>
                          </>
                        ) : null}
                      </Box>

                      {/* Status Score & Attempts Limit */}
                      <Box className="student-exam-status-row">
                        <Box className="student-exam-score-container">
                          <Typography className="student-exam-score-label">
                            Điểm: {row.latestSubmittedAttempt?.scorePercent ?? 0}%
                          </Typography>
                          <Box className="student-exam-progress-bar-wrap">
                            <Box 
                              className="student-exam-progress-bar-fill" 
                              style={{ width: `${row.latestSubmittedAttempt?.scorePercent ?? 0}%` }}
                            />
                          </Box>
                        </Box>
                        
                        <Box className="student-exam-attempts-badge">
                          <RefreshIcon className="student-exam-attempts-icon" />
                          <Typography className="student-exam-attempts-text">
                            Còn {row.attemptsRemaining ?? 0}/{row.maxAttempts ?? 1} lần
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box className="student-exam-card-right">
                    <Button
                      variant="contained"
                      disabled={!canEnter && !row.inProgressAttempt && !row.latestSubmittedAttempt}
                      onClick={() => {
                        const path = studentRoutePaths.examTake(row.id);
                        // Làm đề mới → vào player và tự start, không dừng ở màn "Bắt đầu làm bài"
                        if (row.canStart && !row.inProgressAttempt) {
                          navigate(`${path}?autostart=1`);
                          return;
                        }
                        navigate(path);
                      }}
                      className="student-exam-btn-action"
                    >
                      {cta}
                    </Button>
                    <Button
                      className="student-exam-btn-detail"
                      onClick={() => navigate(studentRoutePaths.examTake(row.id))}
                    >
                      Xem chi tiết <ChevronRightIcon fontSize="inherit" style={{ marginLeft: 2 }} />
                    </Button>
                  </Box>
                </Box>

                {/* Card Timeline visualization */}
                <Box className="student-exam-card-timeline">
                  <Box className="student-exam-timeline-visual">
                    <Box className="student-exam-timeline-line" />
                    
                    <Box className="student-exam-timeline-step">
                      <Box className="student-exam-timeline-dot green">
                        <PlayArrowIcon fontSize="inherit" />
                      </Box>
                      <Typography className="student-exam-timeline-step-title green">Mở làm bài</Typography>
                      <Typography className="student-exam-timeline-step-desc">Bắt đầu từ</Typography>
                      <Typography className="student-exam-timeline-step-val">
                        {row.openAt ? formatWhen(row.openAt) : "Ngay bây giờ"}
                      </Typography>
                    </Box>

                    <Box className="student-exam-timeline-step">
                      <Box className="student-exam-timeline-dot orange">
                        <AccessTimeIcon fontSize="inherit" />
                      </Box>
                      <Typography className="student-exam-timeline-step-title orange">Hạn nộp bài</Typography>
                      <Typography className="student-exam-timeline-step-desc">Nộp trước</Typography>
                      <Typography className="student-exam-timeline-step-val">
                        {row.dueAt ? formatWhen(row.dueAt) : "—"}
                      </Typography>
                    </Box>

                    <Box className="student-exam-timeline-step">
                      <Box className="student-exam-timeline-dot red">
                        <LockIcon fontSize="inherit" />
                      </Box>
                      <Typography className="student-exam-timeline-step-title red">Khóa bài</Typography>
                      <Typography className="student-exam-timeline-step-desc">Sau thời điểm này</Typography>
                      <Typography className="student-exam-timeline-step-val">
                        {row.closeAt ? formatWhen(row.closeAt) : "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Notice Banner */}
                  <Box className="student-exam-timeline-notice">
                    <InfoOutlinedIcon className="student-exam-notice-icon" />
                    <Typography className="student-exam-notice-text">
                      Sau thời điểm khóa bài, bạn sẽ không thể bắt đầu hoặc tiếp tục làm bài.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Back button */}
      <Box className="student-exams-back-btn">
        <Button component={Link} to={studentRoutePaths.home} sx={{ textTransform: "none" }}>
          ← Về trang chủ
        </Button>
      </Box>
    </Box>
  );
}
