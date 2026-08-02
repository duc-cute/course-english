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
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
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
      <Box
        className="teaching-plan-header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          pb: 2,
          mb: 1,
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <CalendarMonthOutlinedIcon sx={{ color: "#2563eb", fontSize: "1.25rem" }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", fontSize: "1.05rem" }}>
              Lịch dạy hôm nay
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5, fontWeight: 600 }}>
            {dateLabel} {summary ? `· ${summary.classesToday} ca dạy` : ""}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <Tooltip title="Làm mới">
            <IconButton
              size="small"
              onClick={() => void loadPlan()}
              disabled={loading}
              sx={{ border: "1px solid #e2e8f0", color: "#64748b", bgcolor: "#ffffff", "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <RefreshOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thêm ca dạy hôm nay">
            <IconButton
              size="small"
              onClick={openCreateToday}
              sx={{ border: "1px solid #e2e8f0", color: "#64748b", bgcolor: "#ffffff", "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <EventOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="text"
            onClick={() => navigate(`/${paths.ADMIN}/${paths.SCHEDULE}`)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8125rem",
              color: "#2563eb",
              bgcolor: "#eff6ff",
              borderRadius: "20px",
              px: 2,
              py: 0.5,
              "&:hover": {
                bgcolor: "#dbeafe",
              },
            }}
          >
            Xem lịch đầy đủ
          </Button>
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
