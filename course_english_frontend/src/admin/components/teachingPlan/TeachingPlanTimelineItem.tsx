import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { sessionSubtitle } from "./teachingPlanUtils";
import { dayjs } from "../../../shared/datetime/dayjsConfig";

type TeachingPlanTimelineItemProps = {
  session: ClassSessionRecord;
  onJoinMeet: (session: ClassSessionRecord) => void;
  onOpenLesson: (session: ClassSessionRecord) => void;
  onStartOnlineClass?: (session: ClassSessionRecord) => void;
  onPasteMeetingLink?: (session: ClassSessionRecord) => void;
  onAssignLesson?: (session: ClassSessionRecord) => void;
  showEdit?: boolean;
  onEdit?: (session: ClassSessionRecord) => void;
  startOnlineClassLoadingId?: string | null;
};

export function TeachingPlanTimelineItem({
  session,
  onJoinMeet,
  onOpenLesson,
  onStartOnlineClass,
  onPasteMeetingLink,
  onAssignLesson,
  showEdit = false,
  onEdit,
  startOnlineClassLoadingId = null,
}: TeachingPlanTimelineItemProps) {
  const isLive = session.uiState === "LIVE";
  const isPast = session.uiState === "PAST";
  const isUpcoming =
    session.uiState === "UPCOMING" ||
    session.uiState === "NEEDS_SETUP" ||
    session.uiState === "NEEDS_START";
  const isWaitingTeacher = session.uiState === "WAITING_TEACHER";
  const classLabel = session.classroomName || session.classroomCode || "Lớp học";
  const showStart =
    session.sessionType === "LIVE_CLASS" &&
    (session.canStartOnlineClass || session.needsSetup) &&
    onStartOnlineClass;
  const showPaste =
    session.sessionType === "LIVE_CLASS" && isWaitingTeacher && onPasteMeetingLink;
  const starting = startOnlineClassLoadingId === session.id;

  const getClassAbbreviation = (name: string): string => {
    if (!name) return "Lớp";
    const match = name.match(/\b\d+[A-Z]\b/i);
    if (match) return match[0].toUpperCase();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (/^\d+[A-Z]?$/i.test(last)) return last.toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  };

  const getClassBadgeClass = (name: string): string => {
    const abbrev = getClassAbbreviation(name);
    if (abbrev.includes("5")) return "var-purple";
    if (abbrev.includes("6")) return "var-green";
    if (abbrev.includes("7")) return "var-orange";
    if (abbrev.includes("8")) return "var-blue";
    const sum = abbrev.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const classes = ["var-purple", "var-green", "var-orange", "var-blue"];
    return classes[sum % classes.length];
  };

  const renderStatusPill = () => {
    if (isLive) {
      return (
        <span className="teaching-plan-row-status active">
          <VideocamOutlinedIcon sx={{ fontSize: 16 }} />
          Đã bắt đầu
        </span>
      );
    }
    if (isPast) {
      return (
        <span className="teaching-plan-row-status completed">
          <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
          Đã kết thúc
        </span>
      );
    }
    if (isWaitingTeacher) {
      return (
        <span className="teaching-plan-row-status waiting">
          <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
          Chờ bắt đầu
        </span>
      );
    }
    return (
      <span className="teaching-plan-row-status pending">
        <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
        Sắp diễn ra
      </span>
    );
  };

  const abbrev = getClassAbbreviation(classLabel);
  const badgeClass = getClassBadgeClass(classLabel);
  const startTime = session.startAt ? dayjs(session.startAt).format("HH:mm") : "00:00";
  const endTime = session.endAt ? dayjs(session.endAt).format("HH:mm") : "00:00";

  return (
    <Box className="teaching-plan-row">
      <Box className="teaching-plan-time-col">
        <span className="teaching-plan-time-start">{startTime}</span>
        <span className="teaching-plan-time-end">- {endTime}</span>
      </Box>
      <Box className={`teaching-plan-square-badge ${badgeClass}`}>
        {abbrev}
      </Box>
      <Box className="teaching-plan-row-info">
        <Typography className="teaching-plan-row-title">
          {session.classroomName || "Lớp học"}
        </Typography>
        <Typography className="teaching-plan-row-sub">
          {session.title || "Chưa nhập tiêu đề"}
        </Typography>
      </Box>
      <Box className="teaching-plan-row-actions">
        {renderStatusPill()}
        {showStart ? (
          <Button
            size="small"
            variant="contained"
            className="teaching-plan-btn teaching-plan-btn--start"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => onStartOnlineClass(session)}
            disabled={starting}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700 }}
          >
            {starting ? "Đang mở…" : "Bắt đầu lớp online"}
          </Button>
        ) : null}
        {showPaste ? (
          <Button
            size="small"
            variant="contained"
            className="teaching-plan-btn teaching-plan-btn--paste"
            startIcon={<LinkOutlinedIcon />}
            onClick={() => onPasteMeetingLink(session)}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700 }}
          >
            Dán link Meet
          </Button>
        ) : null}
        {session.canJoinMeet ? (
          <Button
            size="small"
            variant="contained"
            className="teaching-plan-btn teaching-plan-btn--join"
            startIcon={<VideocamOutlinedIcon />}
            onClick={() => onJoinMeet(session)}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700 }}
          >
            Vào lớp
          </Button>
        ) : null}
        {session.canOpenLesson && session.lessonId ? (
          <Button
            size="small"
            variant="outlined"
            className="teaching-plan-btn"
            startIcon={<MenuBookOutlinedIcon />}
            onClick={() => onOpenLesson(session)}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#475569" }}
          >
            Mở bài
          </Button>
        ) : null}
        {!session.lessonId && !isPast && onAssignLesson ? (
          <Button
            size="small"
            variant="outlined"
            className="teaching-plan-btn"
            startIcon={<LinkOutlinedIcon />}
            onClick={() => onAssignLesson(session)}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#475569" }}
          >
            Gán bài
          </Button>
        ) : null}
        {showEdit && onEdit && session.uiState !== "PAST" ? (
          <Button
            size="small"
            variant="outlined"
            className="teaching-plan-btn"
            startIcon={<EditOutlinedIcon />}
            onClick={() => onEdit(session)}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#475569" }}
          >
            Sửa
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
