import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AssignLessonDialog } from "../../admin/components/teachingPlan/AssignLessonDialog";
import { ClassSessionFormModal } from "../../admin/components/teachingPlan/ClassSessionFormModal";
import { StartOnlineClassDialog } from "../../admin/components/teachingPlan/StartOnlineClassDialog";
import { TeachingPlanTimelineItem } from "../../admin/components/teachingPlan/TeachingPlanTimelineItem";
import { useOnlineClassFlow } from "../../admin/components/teachingPlan/useOnlineClassFlow";
import { WeekScheduleGrid } from "../../admin/components/teachingPlan/WeekScheduleGrid";
import { formatTodayIsoInTz } from "../../admin/components/teachingPlan/teachingPlanUtils";
import {
  formatDaySectionLabel,
  formatWeekRangeLabel,
  getWeekDays,
  getWeekEnd,
  getWeekStart,
  groupSessionsByDay,
  isTodayIso,
  shiftWeek,
} from "../../admin/components/teachingPlan/weekScheduleUtils";
import { apiGetClassrooms, type ClassroomRecord } from "../../shared/api/classroom";
import {
  apiGetTeachingPlanRange,
  type ClassSessionRecord,
  type SessionType,
} from "../../shared/api/classSession";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import { muPageShell } from "./manageUserUiStyles";

type ScheduleViewMode = "list" | "grid";
type ClassSessionFormMode = "quick" | "recurring";

export function TeacherSchedulePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const weekStart = useMemo(() => {
    const param = searchParams.get("week");
    if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
      return getWeekStart(param);
    }
    return getWeekStart();
  }, [searchParams]);

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const viewMode: ScheduleViewMode = searchParams.get("view") === "list" ? "list" : "grid";

  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [classroomFilter, setClassroomFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | SessionType>("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ClassSessionFormMode>("quick");
  const [editing, setEditing] = useState<ClassSessionRecord | null>(null);
  const [createDay, setCreateDay] = useState<string | undefined>();
  const [createStartHour, setCreateStartHour] = useState<number | undefined>();
  const [createStartMinute, setCreateStartMinute] = useState<number | undefined>();
  const [assignSession, setAssignSession] = useState<ClassSessionRecord | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [savingMeetLink, setSavingMeetLink] = useState(false);
  const [cancellingStart, setCancellingStart] = useState(false);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetTeachingPlanRange(weekStart, weekEnd);
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải lịch tuần.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  const {
    pasteSession,
    startingId,
    flowError,
    handleStartOnlineClass,
    openPasteDialog,
    closePasteDialog,
    handleSaveMeetingLink,
    handleCancelOnlineClassStart,
  } = useOnlineClassFlow(loadWeek);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  useEffect(() => {
    void (async () => {
      try {
        const response = (await apiGetClassrooms({ page: 0, size: 100, sort: "name,asc" })) as ApiResponse<{
          result?: ClassroomRecord[];
        }>;
        const items = response?.data?.result ?? response?.result ?? [];
        setClassrooms(Array.isArray(items) ? items : []);
      } catch {
        setClassrooms([]);
      }
    })();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (classroomFilter && s.classroomId !== classroomFilter) return false;
      if (typeFilter && s.sessionType !== typeFilter) return false;
      return true;
    });
  }, [sessions, classroomFilter, typeFilter]);

  const dayGroups = useMemo(
    () => groupSessionsByDay(filteredSessions, weekDays),
    [filteredSessions, weekDays],
  );

  const totalSessions = filteredSessions.length;

  const setWeekStartParam = (iso: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("week", iso);
        return next;
      },
      { replace: true },
    );
  };

  const setViewMode = (mode: ScheduleViewMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "list") {
          next.set("view", "list");
        } else {
          next.delete("view");
        }
        return next;
      },
      { replace: true },
    );
  };

  const openCreate = (day?: string, hour?: number, minute?: number) => {
    setFormMode("quick");
    setEditing(null);
    setCreateDay(day);
    setCreateStartHour(hour);
    setCreateStartMinute(minute);
    setFormOpen(true);
  };

  const openRecurringSetup = () => {
    setFormMode("recurring");
    setEditing(null);
    setCreateDay(undefined);
    setCreateStartHour(undefined);
    setCreateStartMinute(undefined);
    setFormOpen(true);
  };

  const openEdit = (session: ClassSessionRecord) => {
    setEditing(session);
    setCreateDay(undefined);
    setCreateStartHour(undefined);
    setCreateStartMinute(undefined);
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

  return (
    <Box className="admin-dashboard-wrap schedule-week-page" sx={muPageShell}>
      <Box className="schedule-week-toolbar admin-panel-card" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "var(--ac-on-surface)", mb: 0.5 }}>
              Lịch dạy tuần
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--ac-on-surface-variant)" }}>
              {formatWeekRangeLabel(weekStart, weekEnd)} · {totalSessions} ca
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeftIcon />}
              onClick={() => setWeekStartParam(shiftWeek(weekStart, -1))}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Tuần trước
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayOutlinedIcon />}
              onClick={() => setWeekStartParam(getWeekStart(formatTodayIsoInTz()))}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Hôm nay
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={() => setWeekStartParam(shiftWeek(weekStart, 1))}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Tuần sau
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RepeatOutlinedIcon />}
              onClick={openRecurringSetup}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Lịch cố định
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="schedule-class-filter">Lớp học</InputLabel>
            <Select
              labelId="schedule-class-filter"
              label="Lớp học"
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả lớp</MenuItem>
              {classrooms.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="schedule-type-filter">Loại buổi</InputLabel>
            <Select
              labelId="schedule-type-filter"
              label="Loại buổi"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | SessionType)}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="LIVE_CLASS">Lớp trực tuyến</MenuItem>
              <MenuItem value="OFFICE_HOURS">Office hours</MenuItem>
              <MenuItem value="EXAM">Kiểm tra</MenuItem>
              <MenuItem value="OTHER">Khác</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_, value: ScheduleViewMode | null) => {
              if (value) setViewMode(value);
            }}
            aria-label="Chế độ xem lịch"
            sx={{ ml: { sm: "auto" } }}
          >
            <ToggleButton value="grid" aria-label="Lưới tuần">
              <ViewModuleOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
              Lưới
            </ToggleButton>
            <ToggleButton value="list" aria-label="Danh sách">
              <ViewListOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
              Danh sách
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {error || flowError ? (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => void loadWeek()}>Thử lại</Button>}>
          {error || flowError}
        </Alert>
      ) : null}

      {loading ? (
        viewMode === "grid" ? (
          <Skeleton variant="rounded" height={640} />
        ) : (
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={120} />
            ))}
          </Stack>
        )
      ) : viewMode === "grid" ? (
        <WeekScheduleGrid
          dayGroups={dayGroups}
          onCreateSlot={(day, hour, minute) => openCreate(day, hour, minute)}
          onEditSession={openEdit}
        />
      ) : (
        <Stack spacing={2}>
          {dayGroups.map(({ date, sessions: daySessions }) => (
            <Box
              key={date}
              className={`schedule-week-day admin-panel-card${isTodayIso(date) ? " is-today" : ""}`}
              sx={{ p: 2.5 }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ color: isTodayIso(date) ? "var(--ac-primary)" : "var(--ac-on-surface)" }}
                >
                  {formatDaySectionLabel(date)}
                  {isTodayIso(date) ? (
                    <Box component="span" className="schedule-week-today-badge">
                      Hôm nay
                    </Box>
                  ) : null}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<EventOutlinedIcon />}
                  onClick={() => openCreate(date)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Thêm ca dạy
                </Button>
              </Stack>

              {daySessions.length === 0 ? (
                <Box className="schedule-week-day-empty">
                  <Typography variant="body2" sx={{ color: "var(--ac-on-surface-variant)" }}>
                    Chưa có ca dạy
                  </Typography>
                </Box>
              ) : (
                <Box className="teaching-plan-timeline">
                  {daySessions.map((session) => (
                    <TeachingPlanTimelineItem
                      key={session.id}
                      session={session}
                      showEdit
                      onJoinMeet={handleJoinMeet}
                      onOpenLesson={handleOpenLesson}
                      onStartOnlineClass={(s) => void handleStartOnlineClass(s)}
                      onPasteMeetingLink={openPasteDialog}
                      onEdit={openEdit}
                      onAssignLesson={openAssignLesson}
                      startOnlineClassLoadingId={startingId}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

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
        mode={formMode}
        initialDay={createDay}
        initialStartHour={createStartHour}
        initialStartMinute={createStartMinute}
        onClose={() => {
          setFormOpen(false);
          setCreateDay(undefined);
          setCreateStartHour(undefined);
          setCreateStartMinute(undefined);
        }}
        onSaved={loadWeek}
      />

      <AssignLessonDialog
        open={assignOpen}
        session={assignSession}
        onClose={() => {
          setAssignOpen(false);
          setAssignSession(null);
        }}
        onSaved={loadWeek}
      />
    </Box>
  );
}
