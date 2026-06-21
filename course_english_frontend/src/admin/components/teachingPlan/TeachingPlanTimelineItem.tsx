import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { formatSessionTimeRange, sessionSubtitle } from "./teachingPlanUtils";

type TeachingPlanTimelineItemProps = {
  session: ClassSessionRecord;
  onJoinMeet: (session: ClassSessionRecord) => void;
  onOpenLesson: (session: ClassSessionRecord) => void;
  onSetup: (session: ClassSessionRecord) => void;
  onAssignLesson?: (session: ClassSessionRecord) => void;
  showEdit?: boolean;
  onEdit?: (session: ClassSessionRecord) => void;
};

export function TeachingPlanTimelineItem({
  session,
  onJoinMeet,
  onOpenLesson,
  onSetup,
  onAssignLesson,
  showEdit = false,
  onEdit,
}: TeachingPlanTimelineItemProps) {
  const isLive = session.uiState === "LIVE";
  const isPast = session.uiState === "PAST";
  const isUpcoming = session.uiState === "UPCOMING" || session.uiState === "NEEDS_SETUP";
  const classLabel = session.classroomName || session.classroomCode || "Lớp học";

  return (
    <Box
      className={`teaching-plan-timeline-item${isLive ? " is-live" : ""}${isPast ? " is-past" : ""}${isUpcoming ? " is-upcoming" : ""}`}
    >
      <Box className="teaching-plan-timeline-dot" aria-hidden />
      <Box className="teaching-plan-timeline-body">
        <Typography className="teaching-plan-timeline-time" variant="caption">
          {formatSessionTimeRange(session.startAt, session.endAt)}
        </Typography>
        <Typography className="teaching-plan-timeline-title" variant="subtitle1">
          {classLabel}: {session.title}
          {session.recurring ? (
            <Box component="span" className="teaching-plan-recurring-badge">
              Lặp tuần
            </Box>
          ) : null}
        </Typography>
        <Typography className="teaching-plan-timeline-sub" variant="body2">
          {sessionSubtitle(session)}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} className="teaching-plan-timeline-actions" flexShrink={0}>
        {session.needsSetup ? (
          <Button
            size="small"
            variant="contained"
            color="primary"
            className="teaching-plan-btn teaching-plan-btn--setup"
            startIcon={<SettingsOutlinedIcon />}
            onClick={() => onSetup(session)}
          >
            Thiết lập
          </Button>
        ) : null}
        {session.canJoinMeet ? (
          <Button
            size="small"
            variant="contained"
            className="teaching-plan-btn teaching-plan-btn--join"
            startIcon={<VideocamOutlinedIcon />}
            onClick={() => onJoinMeet(session)}
          >
            Vào lớp
          </Button>
        ) : null}
        {!session.canJoinMeet && !session.needsSetup && session.uiState === "UPCOMING" && session.meetLink ? (
          <Button size="small" variant="outlined" disabled className="teaching-plan-btn">
            Chờ giờ
          </Button>
        ) : null}
        {session.canOpenLesson && session.lessonId ? (
          <Button
            size="small"
            variant="outlined"
            className="teaching-plan-btn"
            startIcon={<MenuBookOutlinedIcon />}
            onClick={() => onOpenLesson(session)}
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
          >
            Sửa
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
