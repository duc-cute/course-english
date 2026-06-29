import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  apiGetStudentSupportDetail,
  type StudentSupportDetail,
  type StudentSupportItem,
  type StudentSupportLessonProgress,
  type StudentSupportRiskLevel,
} from "../../../shared/api/studentSupport";
import { paths } from "../../../shared/constants/paths";
import { initialsFromDisplayName } from "../../../student/shared/auth/studentInitials";
import { formatDueAtLabel } from "../teachingPlan/teachingPlanUtils";
import {
  formatTrendPercent,
  riskLevelColors,
  riskLevelLabel,
  riskSeverityLabel,
} from "./studentSupportUtils";

type Props = {
  open: boolean;
  item: StudentSupportItem | null;
  onClose: () => void;
};

function avatarColor(name: string): { bg: string; color: string; border: string } {
  const palette = [
    { bg: "#eff6ff", color: "#2563eb", border: "#dbeafe" },
    { bg: "#f3e8ff", color: "#9333ea", border: "#e9d5ff" },
    { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
    { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  ];
  const index = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function inactiveReasonText(days: number): string {
  if (days <= 0) return "Đang hoạt động bình thường";
  if (days === 1) return "Không đăng nhập 1 ngày";
  return `Không đăng nhập ${days} ngày`;
}

export function StudentSupportProfileDialog({ open, item, onClose }: Props) {
  const [detail, setDetail] = useState<StudentSupportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!item?.studentId || !item.classroomId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetStudentSupportDetail(item.studentId, item.classroomId);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError((err as { message?: string })?.message || "Không thể tải hồ sơ học sinh.");
    } finally {
      setLoading(false);
    }
  }, [item?.studentId, item?.classroomId]);

  useEffect(() => {
    if (open && item) {
      void loadDetail();
    } else {
      setDetail(null);
      setError("");
    }
  }, [open, item, loadDetail]);

  if (!item) {
    return null;
  }

  const profile = detail?.profile ?? item;
  const colors = riskLevelColors(profile.riskLevel);
  const avatar = avatarColor(profile.studentName);
  const hasLessonList =
    (detail?.overdueLessons?.length ?? 0) > 0 ||
    (detail?.upcomingLessons?.length ?? 0) > 0 ||
    (detail?.completedLessons?.length ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      className="student-support-profile-dialog"
      PaperProps={{ sx: { m: 2 } }}
    >
      <Box className="student-support-profile-header">
        <IconButton className="student-support-profile-close" aria-label="Đóng" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box className="student-support-profile-identity">
          <Avatar
            src={profile.avatarUrl || undefined}
            className="student-support-profile-avatar-lg"
            sx={{ bgcolor: avatar.bg, color: avatar.color, border: `1px solid ${avatar.border}` }}
          >
            {initialsFromDisplayName(profile.studentName)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box className="student-support-profile-name-row">
              <Typography className="student-support-profile-name-lg" noWrap>
                {profile.studentName}
              </Typography>
              <span
                className="student-support-risk-badge student-support-profile-header-badge"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  borderColor: colors.border,
                }}
              >
                <span className="student-support-risk-badge-dot" style={{ background: colors.text }} />
                {riskLevelLabel(profile.riskLevel)}
              </span>
            </Box>
            <Typography className="student-support-profile-class">{profile.classroomName}</Typography>
          </Box>
        </Box>
      </Box>

      <Box className={`student-support-profile-body${hasLessonList ? " is-scrollable" : ""}`}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <>
            <Skeleton variant="rounded" height={88} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" height={88} sx={{ mb: 1.5 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 3 }}>
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={72} />
            </Box>
            <Skeleton variant="rounded" height={160} />
          </>
        ) : (
          <>
            <Box className="student-support-profile-metrics-primary">
              <RiskScoreCard level={profile.riskLevel} score={profile.riskScore} colors={colors} />
              <Box
                className="student-support-profile-metric-hero"
                sx={{ bgcolor: "#f8fafc", borderColor: "#f1f5f9" }}
              >
                <Typography className="student-support-profile-metric-hero-label" sx={{ color: "#64748b" }}>
                  Nguyên nhân chính
                </Typography>
                <Typography className="student-support-profile-metric-reason-title">
                  {profile.primaryReason || "—"}
                </Typography>
                <Typography className="student-support-profile-metric-reason-sub">
                  {inactiveReasonText(profile.inactiveDays)}
                </Typography>
              </Box>
            </Box>

            <Box className="student-support-profile-metrics-secondary">
              <MetricTile
                label="Missing"
                value={String(profile.missingAssignments)}
                unit="bài"
              />
              <MetricTile
                label="Avg Score"
                value={profile.avgScorePercent != null ? String(profile.avgScorePercent) : "—"}
              />
              <MetricTile label="Score Trend" value={formatTrendPercent(profile.scoreTrendPercent)} />
            </Box>

            <Typography className="student-support-profile-section-title">Tình trạng bài tập</Typography>

            <AssignmentSection
              title="Quá hạn"
              emptyText="Không có bài quá hạn"
              lessons={detail?.overdueLessons ?? []}
              tone="overdue"
              secondary={(lesson) => `Hạn: ${formatDueAtLabel(lesson.dueAt)}`}
            />
            <AssignmentSection
              title="Chưa làm (Còn hạn)"
              emptyText="Không có bài sắp đến hạn"
              lessons={detail?.upcomingLessons ?? []}
              tone="upcoming"
              secondary={(lesson) => `Hạn: ${formatDueAtLabel(lesson.dueAt)}`}
            />
            <AssignmentSection
              title="Đã hoàn thành"
              emptyText="Chưa có bài pass"
              lessons={detail?.completedLessons ?? []}
              tone="completed"
              secondary={(lesson) => {
                const parts: string[] = [];
                if (lesson.bestScorePercent != null) parts.push(`Điểm: ${lesson.bestScorePercent}%`);
                if (lesson.completedAt) parts.push(`Nộp: ${formatDueAtLabel(lesson.completedAt)}`);
                return parts.join(" · ") || undefined;
              }}
            />
          </>
        )}
      </Box>

      <Box className="student-support-profile-footer">
        <Button variant="outlined" className="student-support-profile-btn-close" onClick={onClose}>
          Đóng
        </Button>
        <Button
          variant="contained"
          className="student-support-profile-btn-remind"
          startIcon={<ChatBubbleOutlineOutlinedIcon fontSize="small" />}
          disabled
          title="Tính năng nhắn tin nhắc nhở sắp ra mắt"
        >
          Nhắn tin nhắc nhở
        </Button>
      </Box>
    </Dialog>
  );
}

function RiskScoreCard({
  level,
  score,
  colors,
}: {
  level: StudentSupportRiskLevel;
  score: number;
  colors: { bg: string; text: string; border: string };
}) {
  return (
    <Box
      className="student-support-profile-metric-hero"
      sx={{
        bgcolor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Typography className="student-support-profile-metric-hero-label" sx={{ color: colors.text, opacity: 0.85 }}>
        Risk Score
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <Typography className="student-support-profile-metric-hero-value" sx={{ color: colors.text }}>
          {score}
        </Typography>
        <span
          className="student-support-profile-metric-hero-tag"
          style={{ color: colors.text, borderColor: colors.border }}
        >
          {riskSeverityLabel(level)}
        </span>
      </Box>
    </Box>
  );
}

function MetricTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const isEmpty = value === "—";
  return (
    <Box className="student-support-profile-metric-tile">
      <span className="student-support-profile-metric-tile-label">{label}</span>
      <span className="student-support-profile-metric-tile-value" style={{ color: isEmpty ? "#cbd5e1" : "#1e293b" }}>
        {value}
        {unit && value !== "—" ? <span className="student-support-profile-metric-tile-unit"> {unit}</span> : null}
      </span>
    </Box>
  );
}

function AssignmentSection({
  title,
  emptyText,
  lessons,
  tone,
  secondary,
}: {
  title: string;
  emptyText: string;
  lessons: StudentSupportLessonProgress[];
  tone: "overdue" | "upcoming" | "completed";
  secondary: (lesson: StudentSupportLessonProgress) => string | undefined;
}) {
  const iconConfig = {
    overdue: { bg: "#fef2f2", color: "#ef4444", Icon: AccessTimeOutlinedIcon },
    upcoming: { bg: "#eff6ff", color: "#3b82f6", Icon: DescriptionOutlinedIcon },
    completed: { bg: "#ecfdf5", color: "#10b981", Icon: CheckCircleOutlineOutlinedIcon },
  }[tone];

  const { bg, color, Icon } = iconConfig;

  return (
    <Box className="student-support-profile-assignment-item">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box className="student-support-profile-assignment-main">
          <Box className="student-support-profile-assignment-icon" sx={{ bgcolor: bg, color }}>
            <Icon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {lessons.length === 0 ? (
              <Typography className="student-support-profile-assignment-title" component="div">
                {title}
                <Typography className="student-support-profile-assignment-sub" component="span">
                  {emptyText}
                </Typography>
              </Typography>
            ) : (
              <>
                <Typography className="student-support-profile-assignment-title" component="div">
                  {title}
                </Typography>
                <Typography className="student-support-profile-assignment-sub" component="div">
                  {`${lessons.length} bài`}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {lessons.length > 0 ? (
          <ul className="student-support-profile-lesson-list">
            {lessons.map((lesson) => (
              <li key={lesson.lessonId}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 600, color: "#334155", fontSize: "0.75rem" }}>
                    {lesson.title}
                  </Typography>
                  {secondary(lesson) ? (
                    <Typography component="div" sx={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                      {secondary(lesson)}
                    </Typography>
                  ) : null}
                </Box>
                <IconButton
                  size="small"
                  component={RouterLink}
                  to={`/${paths.ADMIN}/manage-lesson/${lesson.lessonId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở bài học"
                  sx={{ color: "#0052cc" }}
                >
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : null}
      </Box>
      <span className="student-support-profile-assignment-count">{lessons.length}</span>
    </Box>
  );
}
