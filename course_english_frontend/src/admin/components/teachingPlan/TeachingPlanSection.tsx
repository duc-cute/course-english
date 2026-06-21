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
import { TeachingPlanTimelineItem } from "./TeachingPlanTimelineItem";
import { formatNextClassLabel, formatPlanDateLabel } from "./teachingPlanUtils";

export function TeachingPlanSection() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TeachingPlanDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSessionRecord | null>(null);
  const [assignSession, setAssignSession] = useState<ClassSessionRecord | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

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

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openSetup = (session: ClassSessionRecord) => {
    setEditing(session);
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
    <Box className="teaching-plan-section admin-panel-card" sx={{ mb: 3, p: 3 }}>
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
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ color: "var(--ac-on-surface-variant)", fontWeight: 600 }}>
            {dateLabel}
          </Typography>
          <Button
            size="small"
            variant="text"
            endIcon={<ChevronRightIcon />}
            onClick={() => navigate(`/${paths.ADMIN}/${paths.SCHEDULE}`)}
            sx={{ textTransform: "none", fontWeight: 700, color: "var(--ac-primary)" }}
          >
            Xem tuần
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void loadPlan()}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Làm mới
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<EventOutlinedIcon />}
            onClick={openCreate}
            sx={{ textTransform: "none", fontWeight: 700, boxShadow: "0 4px 0 0 #004395" }}
          >
            Lên lịch
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} action={<Button onClick={() => void loadPlan()}>Thử lại</Button>}>
          {error}
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
              Hôm nay bạn chưa có buổi dạy nào.
            </Typography>
            <Button variant="contained" startIcon={<EventOutlinedIcon />} onClick={openCreate} sx={{ textTransform: "none" }}>
              Lên lịch buổi dạy
            </Button>
          </Box>
        ) : (
          sessions.map((session) => (
            <TeachingPlanTimelineItem
              key={session.id}
              session={session}
              onJoinMeet={handleJoinMeet}
              onOpenLesson={handleOpenLesson}
              onSetup={openSetup}
              onAssignLesson={openAssignLesson}
            />
          ))
        )}
      </Box>

      <ClassSessionFormModal
        open={formOpen}
        editing={editing}
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
