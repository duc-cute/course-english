import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetTeachingPlanToday,
  type ClassSessionRecord,
  type TeachingPlanDTO,
} from "../../../shared/api/classSession";
import { paths } from "../../../shared/constants/paths";
import { ClassSessionFormModal } from "./ClassSessionFormModal";
import { AssignLessonDialog } from "./AssignLessonDialog";
import { StartOnlineClassDialog } from "./StartOnlineClassDialog";
import { TeachingPlanTimelineItem } from "./TeachingPlanTimelineItem";
import { useOnlineClassFlow } from "./useOnlineClassFlow";
import { formatNextClassLabel, formatPlanDateLabel, formatTodayIsoInTz } from "./teachingPlanUtils";

const headerIconBtnSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  minWidth: { xs: 36, sm: "auto" },
  width: { xs: 36, sm: "auto" },
  height: { xs: 36, sm: "auto" },
  p: { xs: 0, sm: undefined },
  px: { xs: 0, sm: 1.5 },
  boxSizing: "border-box" as const,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  "& .MuiButton-startIcon": { margin: 0, mr: { xs: 0, sm: 1 } },
  "& .MuiButton-endIcon": { margin: 0, ml: { xs: 0, sm: 0.5 } },
};

export function TeachingPlanSection() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TeachingPlanDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSessionRecord | null>(null);
  const [assignSession, setAssignSession] = useState<ClassSessionRecord | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [savingMeetLink, setSavingMeetLink] = useState(false);
  const [cancellingStart, setCancellingStart] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetTeachingPlanToday();
      setPlan(data);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải kế hoạch dạy hôm nay.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    pasteSession,
    startingId,
    flowError,
    handleStartOnlineClass,
    openPasteDialog,
    closePasteDialog,
    handleSaveMeetingLink,
    handleCancelOnlineClassStart,
  } = useOnlineClassFlow(loadPlan);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const openCreateToday = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openAssignLesson = (session: ClassSessionRecord) => {
    setAssignSession(session);
    setAssignOpen(true);
  };

  const handleJoinMeet = (session: ClassSessionRecord) => {
    if (session.meetLink) {
      window.open(session.meetLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenLesson = (session: ClassSessionRecord) => {
    if (session.lessonId) {
      navigate(`/${paths.ADMIN}/manage-lesson/${session.lessonId}/edit`);
    }
  };

  const summary = plan?.summary;
  const sessions = plan?.sessions ?? [];
  const dateLabel = plan?.date ? formatPlanDateLabel(plan.date) : formatPlanDateLabel(new Date().toISOString());

  return (
    <Box className="teaching-plan-section admin-panel-card" sx={{ mb: 3, p: { xs: 2, md: 3 } }}>
      <Box className="teaching-plan-header">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <CalendarMonthOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: "var(--ac-on-surface)" }}>
              Kế hoạch dạy hôm nay
            </Typography>
          </Stack>
          {summary ? (
            <Stack direction="row" flexWrap="wrap" gap={2} sx={{ color: "var(--ac-on-surface-variant)" }}>
              <Stack direction="row" alignItems="center" spacing={0.5} component="span">
                <SchoolOutlinedIcon sx={{ fontSize: 18, color: "var(--ac-primary)" }} />
                <Typography variant="body2" component="span">
                  {summary.classesToday} lớp hôm nay
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} component="span">
                <ScheduleOutlinedIcon sx={{ fontSize: 18, color: "var(--ac-primary)" }} />
                <Typography variant="body2" component="span" fontWeight={700} sx={{ color: "var(--ac-primary)" }}>
                  {formatNextClassLabel(summary.nextSessionInMinutes ?? null) ?? "Không còn buổi sắp tới"}
                </Typography>
              </Stack>
            </Stack>
          ) : null}
        </Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="nowrap"
          useFlexGap
          className="teaching-plan-header-actions"
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              color: "var(--ac-on-surface-variant)",
              fontWeight: 600,
              flex: 1,
              minWidth: 0,
            }}
          >
            {dateLabel}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
          <Button
            size="small"
            variant="text"
            className="teaching-plan-header-icon-btn"
            onClick={() => navigate(`/${paths.ADMIN}/${paths.SCHEDULE}`)}
            sx={{ ...headerIconBtnSx, color: "var(--ac-primary)" }}
            aria-label="Xem tuần"
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>
              Xem tuần
            </Box>
          </Button>
          <Button
            size="small"
            variant="outlined"
            className="teaching-plan-header-icon-btn"
            onClick={() => void loadPlan()}
            disabled={loading}
            sx={headerIconBtnSx}
            aria-label="Làm mới"
          >
            <RefreshOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 }, display: { xs: "inline-flex", sm: "none" } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline-flex" }, alignItems: "center", gap: 0.5 }}>
              <RefreshOutlinedIcon fontSize="small" />
              Làm mới
            </Box>
          </Button>
          <Button
            size="small"
            variant="contained"
            className="teaching-plan-header-icon-btn"
            onClick={openCreateToday}
            sx={{
              ...headerIconBtnSx,
              boxShadow: { xs: "none", sm: "0 4px 0 0 #004395" },
              "&:hover": { boxShadow: { xs: "none", sm: "0 4px 0 0 #004395" } },
            }}
            aria-label="Thêm ca hôm nay"
          >
            <EventOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 }, display: { xs: "inline-flex", sm: "none" } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline-flex" }, alignItems: "center", gap: 0.5 }}>
              <EventOutlinedIcon fontSize="small" />
              + Ca hôm nay
            </Box>
          </Button>
          </Stack>
        </Stack>
      </Box>

      {error || flowError ? (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button
              onClick={() => {
                setError("");
                void loadPlan();
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error || flowError}
        </Alert>
      ) : null}

      <Box className="teaching-plan-timeline" sx={{ mt: 3 }}>
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={72} />
            ))}
          </Stack>
        ) : sessions.length === 0 ? (
          <Box className="teaching-plan-empty">
            <Typography variant="body1" sx={{ mb: 2, color: "var(--ac-on-surface-variant)" }}>
              Hôm nay bạn chưa có ca dạy nào.
            </Typography>
            <Button variant="contained" startIcon={<EventOutlinedIcon />} onClick={openCreateToday} sx={{ textTransform: "none" }}>
              + Ca hôm nay
            </Button>
          </Box>
        ) : (
          sessions.map((session) => (
            <TeachingPlanTimelineItem
              key={session.id}
              session={session}
              onJoinMeet={handleJoinMeet}
              onOpenLesson={handleOpenLesson}
              onStartOnlineClass={(s) => void handleStartOnlineClass(s)}
              onPasteMeetingLink={openPasteDialog}
              onAssignLesson={openAssignLesson}
              startOnlineClassLoadingId={startingId}
            />
          ))
        )}
      </Box>

      <StartOnlineClassDialog
        open={Boolean(pasteSession)}
        session={pasteSession}
        saving={savingMeetLink}
        cancelling={cancellingStart}
        onClose={closePasteDialog}
        onSave={async (meetLink) => {
          setSavingMeetLink(true);
          try {
            await handleSaveMeetingLink(meetLink);
          } finally {
            setSavingMeetLink(false);
          }
        }}
        onCancelStart={async () => {
          setCancellingStart(true);
          try {
            await handleCancelOnlineClassStart();
          } finally {
            setCancellingStart(false);
          }
        }}
      />

      <ClassSessionFormModal
        open={formOpen}
        editing={editing}
        mode="quick"
        initialDay={formatTodayIsoInTz()}
        onClose={() => setFormOpen(false)}
        onSaved={() => void loadPlan()}
      />

      <AssignLessonDialog
        open={assignOpen}
        session={assignSession}
        onClose={() => {
          setAssignOpen(false);
          setAssignSession(null);
        }}
        onSaved={() => void loadPlan()}
      />
    </Box>
  );
}
