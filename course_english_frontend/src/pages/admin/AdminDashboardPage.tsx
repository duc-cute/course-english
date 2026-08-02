import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import MyLocationOutlinedIcon from "@mui/icons-material/MyLocationOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import OpacityOutlinedIcon from "@mui/icons-material/OpacityOutlined";
import AirOutlinedIcon from "@mui/icons-material/AirOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import UmbrellaOutlinedIcon from "@mui/icons-material/UmbrellaOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dayjs } from "../../shared/datetime/dayjsConfig";
import { StartOnlineClassDialog } from "../../admin/components/teachingPlan/StartOnlineClassDialog";
import { CommunityVoiceWidget } from "../../admin/components/innovation/CommunityVoiceWidget";
import { InnovationSubmitDrawer } from "../../admin/components/innovation/InnovationSubmitDrawer";
import { useOnlineClassFlow } from "../../admin/components/teachingPlan/useOnlineClassFlow";
import {
  formatSessionTimeRange,
} from "../../admin/components/teachingPlan/teachingPlanUtils";
import {
  apiGetTeachingPlanToday,
  type ClassSessionRecord,
} from "../../shared/api/classSession";
import { apiGetClassrooms } from "../../shared/api/classroom";
import {
  apiGetStudentSupportSummary,
  apiGetStudentSupportWidget,
  type StudentSupportItem,
  type StudentSupportSummary,
} from "../../shared/api/studentSupport";
import type { ApiResponse } from "../../shared/api/types";
import { apiGetUsers } from "../../shared/api/user";
import {
  apiSearchVocabularySetAssignments,
  type VocabularySetAssignmentRecord,
} from "../../shared/api/vocabularySetAssignment";
import {
  apiFetchWeather,
  buildRuleBasedWeatherTip,
  detectGpsWeatherLocation,
  loadWeatherLocationPreference,
  locationFromPreset,
  peekCachedWeather,
  saveWeatherLocationPreference,
  uvLabel,
  WEATHER_CITY_PRESETS,
  type WeatherLocation,
  type WeatherSnapshot,
} from "../../shared/api/weather";
import { apiFetchWeatherTeachingTip } from "../../shared/api/weatherAiTip";
import { paths } from "../../shared/constants/paths";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";
import { daysUntilDue } from "../../student/vocab/vocabProgressUtils";

const BADGE_VARIANTS = ["5a", "6b", "7a", "8c"] as const;

function badgeVariant(name: string): (typeof BADGE_VARIANTS)[number] {
  const clean = name.toUpperCase();
  if (clean.includes("5")) return "5a";
  if (clean.includes("6")) return "6b";
  if (clean.includes("7")) return "7a";
  if (clean.includes("8")) return "8c";

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % BADGE_VARIANTS.length;
  }
  return BADGE_VARIANTS[hash];
}

function classroomShortLabel(session: ClassSessionRecord): string {
  const raw = (session.classroomCode || session.classroomName || "?").trim();
  if (raw.length <= 3) return raw.toUpperCase();
  return raw.slice(0, 3).toUpperCase();
}

function sessionStatusLabel(session: ClassSessionRecord): { text: string; active: boolean } {
  if (session.uiState === "LIVE" || session.status === "IN_PROGRESS") {
    return { text: "Đã bắt đầu", active: true };
  }
  if (session.uiState === "PAST" || session.status === "COMPLETED") {
    return { text: "Đã kết thúc", active: false };
  }
  if (session.status === "CANCELLED") {
    return { text: "Đã hủy", active: false };
  }
  return { text: "Sắp diễn ra", active: false };
}

function greetingByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function supportBarClass(level: StudentSupportItem["riskLevel"]): string {
  if (level === "CRITICAL") return "admin-support-bar-fill--critical";
  if (level === "WARNING") return "admin-support-bar-fill--warning";
  return "admin-support-bar-fill--attention";
}

function supportInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function assignmentDueBadge(dueAt?: string | null): { label: string; kind: "today" | "soon" } | null {
  const days = daysUntilDue(dueAt);
  if (days == null) return null;
  if (days < 0) {
    return { label: days === -1 ? "Quá hạn 1 ngày" : `Quá hạn ${Math.abs(days)} ngày`, kind: "today" };
  }
  if (days === 0) return { label: "Hôm nay", kind: "today" };
  if (days === 1) return { label: "1 ngày nữa", kind: "soon" };
  if (days <= 7) return { label: `${days} ngày nữa`, kind: "soon" };
  return {
    label: new Date(dueAt!).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    kind: "soon",
  };
}

function getWeatherTheme(code?: number | null): { image: string; gradient: string } {
  if (code == null) {
    return {
      image: "/images/dashboard_weather_bg.png",
      gradient: "linear-gradient(180deg, #7eb6ff 0%, #b8d7ff 100%)",
    };
  }

  // Clear / Sunny
  if (code === 0 || code === 1) {
    return {
      image: "/images/weather/clear.png",
      gradient: "linear-gradient(135deg, #3a86ff 0%, #ffbe0b 100%)",
    };
  }
  // Cloudy / Overcast
  if (code === 2 || code === 3) {
    return {
      image: "/images/weather/cloudy.png",
      gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)",
    };
  }
  // Fog
  if (code === 45 || code === 48) {
    return {
      image: "/images/weather/fog.png",
      gradient: "linear-gradient(135deg, #64748b 0%, #cbd5e1 100%)",
    };
  }
  // Rain / Drizzle / Showers
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      image: "/images/weather/rain.png",
      gradient: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
    };
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return {
      image: "/images/weather/snow.png",
      gradient: "linear-gradient(135deg, #94a3b8 0%, #e2e8f0 100%)",
    };
  }
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return {
      image: "/images/weather/thunderstorm.png",
      gradient: "linear-gradient(135deg, #0f172a 0%, #312e81 100%)",
    };
  }

  // Fallback (Cloudy)
  return {
    image: "/images/weather/cloudy.png",
    gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)",
  };
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { displayName } = useStudentAccountProfile();
  const teacherName = displayName || "Giáo viên";

  const [sessions, setSessions] = useState<ClassSessionRecord[]>([]);
  const [classesToday, setClassesToday] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [classroomCount, setClassroomCount] = useState(0);
  const [supportSummary, setSupportSummary] = useState<StudentSupportSummary | null>(null);
  const [supportItems, setSupportItems] = useState<StudentSupportItem[]>([]);
  const [assignments, setAssignments] = useState<VocabularySetAssignmentRecord[]>([]);
  const [upcomingAssignmentCount, setUpcomingAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingMeetLink, setSavingMeetLink] = useState(false);
  const [cancellingStart, setCancellingStart] = useState(false);

  const [weather, setWeather] = useState<WeatherSnapshot | null>(() => peekCachedWeather());
  const [weatherLoading, setWeatherLoading] = useState(() => !peekCachedWeather());
  const [weatherError, setWeatherError] = useState("");
  const [aiTip, setAiTip] = useState(() => {
    const cached = peekCachedWeather();
    return cached ? buildRuleBasedWeatherTip(cached) : "";
  });
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [locationOverride, setLocationOverride] = useState<WeatherLocation | null>(null);
  const [locationMenuEl, setLocationMenuEl] = useState<null | HTMLElement>(null);
  const [innovationDrawerOpen, setInnovationDrawerOpen] = useState(false);
  const [communityVoiceRefresh, setCommunityVoiceRefresh] = useState(0);

  const savedLocationName = loadWeatherLocationPreference()?.name;

  const weatherTheme = useMemo(() => {
    return getWeatherTheme(weather?.weatherCode);
  }, [weather]);

  const handleViewSchedule = () => navigate(`/${paths.ADMIN}/${paths.SCHEDULE}`);
  const handleViewSupport = () => navigate(`/${paths.ADMIN}/${paths.STUDENTS_NEED_SUPPORT}`);
  const handleViewUsers = () => navigate(`/${paths.ADMIN}/${paths.MANAGE_USER}`);
  const handleViewClassrooms = () => navigate(`/${paths.ADMIN}/${paths.MANAGE_CLASSROOM}`);
  const handleViewVocabSets = () => navigate(`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`);

  /** Weather: dùng preference + cache trước; GPS chỉ lần đầu (chưa lưu) hoặc khi user bấm menu. */
  useEffect(() => {
    const abort = new AbortController();
    let cancelled = false;
    const hasSavedLocation = Boolean(locationOverride || loadWeatherLocationPreference());
    const cachedNow = peekCachedWeather(locationOverride);

    void (async () => {
      // Có cache sẵn → không hiện "đang xác định vị trí", chỉ soft-refresh nếu cần.
      if (cachedNow && !locationOverride) {
        setWeather(cachedNow);
        setWeatherLoading(false);
        setAiTip(buildRuleBasedWeatherTip(cachedNow));
      } else {
        setWeatherLoading(true);
      }
      setWeatherError("");
      try {
        const snapshot = await apiFetchWeather(locationOverride, {
          signal: abort.signal,
          // Chỉ xin GPS khi chưa từng lưu vị trí.
          preferGps: !hasSavedLocation,
          bypassCache: Boolean(locationOverride),
        });
        if (cancelled) return;
        setWeather(snapshot);
        setWeatherLoading(false);
        setAiTip(buildRuleBasedWeatherTip(snapshot));
        setAiTipLoading(true);
        const tipResult = await apiFetchWeatherTeachingTip(snapshot, { signal: abort.signal });
        if (cancelled) return;
        setAiTip(tipResult.tip);
      } catch (err) {
        if (cancelled || abort.signal.aborted) return;
        // Giữ cache cũ nếu có — đừng xóa UI vì lỗi mạng.
        if (!cachedNow) {
          setWeatherError((err as { message?: string })?.message || "Không tải được thời tiết.");
        }
        setWeatherLoading(false);
      } finally {
        if (!cancelled) setAiTipLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [locationOverride]);

  const selectCityPreset = (presetId: string) => {
    const preset = WEATHER_CITY_PRESETS.find((c) => c.id === presetId);
    if (!preset) return;
    const loc = locationFromPreset(preset);
    saveWeatherLocationPreference(loc);
    setLocationOverride(loc);
    setLocationMenuEl(null);
  };

  const selectGpsLocation = () => {
    setLocationMenuEl(null);
    void (async () => {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const loc = await detectGpsWeatherLocation();
        const confirmed = { ...loc, userPicked: true };
        saveWeatherLocationPreference(confirmed);
        setLocationOverride(confirmed);
      } catch (err) {
        setWeatherLoading(false);
        setWeatherError(
          (err as { message?: string })?.message ||
            "Không lấy được vị trí. Hãy chọn tỉnh/thành trong menu.",
        );
      }
    })();
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [plan, supportWidget, supportSum, usersRes, classroomsRes, assignmentsRes] =
        await Promise.all([
          apiGetTeachingPlanToday(),
          apiGetStudentSupportWidget().catch(() => [] as StudentSupportItem[]),
          apiGetStudentSupportSummary().catch(() => null),
          apiGetUsers({ page: 0, size: 1, roleName: "STUDENT_ROLE" }).catch(() => null),
          apiGetClassrooms({ page: 0, size: 1 }).catch(() => null),
          apiSearchVocabularySetAssignments({ page: 0, size: 30, sort: "dueAt,asc" }).catch(
            () => null,
          ),
        ]);

      const planSessions = (plan.sessions ?? []).filter((s) => s.status !== "CANCELLED");
      setSessions(planSessions);
      setClassesToday(plan.summary?.classesToday ?? plan.summary?.sessionsToday ?? planSessions.length);
      setSupportItems(Array.isArray(supportWidget) ? supportWidget.slice(0, 5) : []);
      setSupportSummary(supportSum);

      const usersData = usersRes as ApiResponse<{ meta?: { total?: number }; result?: unknown[] }> | null;
      const studentTotal =
        usersData?.data?.meta?.total ??
        (usersData as { meta?: { total?: number } } | null)?.meta?.total ??
        0;
      setStudentCount(Number(studentTotal) || 0);

      const classData = classroomsRes as ApiResponse<{ meta?: { total?: number } }> | null;
      const classTotal =
        classData?.data?.meta?.total ??
        (classData as { meta?: { total?: number } } | null)?.meta?.total ??
        0;
      setClassroomCount(Number(classTotal) || 0);

      const assignmentPayload = assignmentsRes as ApiResponse<{
        result?: VocabularySetAssignmentRecord[];
      }> | null;
      const rawAssignments =
        assignmentPayload?.data?.result ??
        (assignmentPayload as { result?: VocabularySetAssignmentRecord[] } | null)?.result ??
        [];
      const upcoming = (Array.isArray(rawAssignments) ? rawAssignments : [])
        .filter((a) => a.dueAt && a.status !== "CANCELLED")
        .map((a) => ({ item: a, days: daysUntilDue(a.dueAt) }))
        .filter((x) => x.days != null && x.days <= 14)
        .sort((a, b) => (a.days ?? 99) - (b.days ?? 99));
      setUpcomingAssignmentCount(upcoming.length);
      setAssignments(upcoming.slice(0, 5).map((x) => x.item));
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải tổng quan.");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    pasteSession,
    startingId,
    flowError,
    handleStartOnlineClass,
    closePasteDialog,
    handleSaveMeetingLink,
    handleCancelOnlineClassStart,
  } = useOnlineClassFlow(loadDashboard);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const visibleSessions = useMemo(() => sessions.slice(0, 5), [sessions]);

  const handleSessionCamera = (session: ClassSessionRecord) => {
    if (session.canJoinMeet && session.meetLink) {
      window.open(session.meetLink, "_blank", "noopener,noreferrer");
      return;
    }
    if (session.canStartOnlineClass || session.needsSetup) {
      void handleStartOnlineClass(session);
    }
  };

  const atRiskCount = supportSummary?.totalAtRisk ?? supportItems.length;

  return (
    <Box className="admin-dashboard-wrap" sx={{ width: "100%", pb: 4 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {flowError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {flowError}
        </Alert>
      ) : null}

      {/* SECTION 1: Welcome + Weather + Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7.5fr 4.5fr" },
          gap: 2,
          mb: 2,
          alignItems: "stretch",
        }}
      >
        {/* Welcome Card */}
        <Box
          sx={{
            gridColumn: { xs: "1", lg: "1" },
            gridRow: { xs: "1", lg: "1" },
            display: "flex",
          }}
        >
          <Box className="admin-welcome-card" sx={{ flexGrow: 1 }}>
            <Box className="admin-welcome-card-content">
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  color: "var(--ac-on-surface)",
                  mb: 1,
                  fontSize: { xs: "1.75rem", sm: "2.25rem" },
                }}
              >
                {greetingByHour()}, {teacherName}! 👋
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "var(--ac-on-surface-variant)", lineHeight: 1.5, fontSize: "1rem" }}
              >
                Mỗi ngày là một cơ hội để truyền cảm hứng cho học sinh.
              </Typography>
            </Box>
            <Box className="admin-welcome-card-graphic" sx={{ display: { xs: "none", sm: "flex" } }}>
              <img
                src="/images/dashboard_welcome_3d.png"
                alt="Welcome"
                style={{ width: "160px", height: "140px", objectFit: "contain" }}
              />
            </Box>
          </Box>
        </Box>

        {/* Weather Card */}
        <Box
          sx={{
            gridColumn: { xs: "1", lg: "2" },
            gridRow: { xs: "2", lg: "1 / span 2" },
            display: "flex",
          }}
        >
          <Box
            className="admin-weather-card"
            sx={{
              background: weatherTheme.gradient,
              transition: "background 0.5s ease",
              flexGrow: 1,
            }}
          >
            <img
              src={weatherTheme.image}
              alt=""
              className="admin-weather-bg-sky"
              style={{ objectFit: "cover" }}
            />
            <Box className="admin-weather-header">
              <Box
                className="admin-weather-location"
                onClick={(e) => setLocationMenuEl(e.currentTarget)}
                sx={{ cursor: "pointer" }}
                title="Bấm để đổi tỉnh/thành"
              >
                <PlaceOutlinedIcon fontSize="inherit" />
                {weather?.location.name ??
                  locationOverride?.name ??
                  savedLocationName ??
                  (weatherLoading ? "Đang tải thời tiết…" : "Chọn vị trí")}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {weatherError ? (
                  <Typography
                    component="span"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: "rgba(239,68,68,0.35)",
                    }}
                  >
                    Lỗi
                  </Typography>
                ) : null}
                <Tooltip title="Đổi vị trí thời tiết">
                  <IconButton
                    size="small"
                    sx={{ color: "white" }}
                    aria-label="Đổi vị trí"
                    onClick={(e) => setLocationMenuEl(e.currentTarget)}
                  >
                    <MoreHorizOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Menu
                anchorEl={locationMenuEl}
                open={Boolean(locationMenuEl)}
                onClose={() => setLocationMenuEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={selectGpsLocation}>
                  <ListItemIcon>
                    <MyLocationOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Dùng vị trí hiện tại (GPS)" />
                </MenuItem>
                {WEATHER_CITY_PRESETS.map((city) => (
                  <MenuItem
                    key={city.id}
                    selected={weather?.location.presetId === city.id}
                    onClick={() => selectCityPreset(city.id)}
                  >
                    <ListItemText primary={city.label} secondary={city.name} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Box className="admin-weather-body">
              <Box className="admin-weather-temp-box">
                <Box className="admin-weather-temp">
                  {weatherLoading && !weather ? (
                    <Skeleton width={80} sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                  ) : (
                    `${weather?.temperatureC ?? "--"}°C`
                  )}
                </Box>
                <Box className="admin-weather-sky-text">
                  {weatherLoading && !weather ? (
                    <Skeleton width={100} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    weather?.skyLabelVi ?? weatherError ?? "—"
                  )}
                </Box>
                <Box className="admin-weather-feels">
                  {weather
                    ? `Cảm giác như ${weather.feelsLikeC}°C`
                    : weatherLoading
                      ? "Đang cập nhật…"
                      : "Không có dữ liệu"}
                </Box>
              </Box>

              <Box className="admin-weather-metrics">
                <Box className="admin-weather-metric-item">
                  <OpacityOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Độ ẩm</Box>
                  <Box className="admin-weather-metric-value">
                    {weather ? `${weather.humidityPercent}%` : "—"}
                  </Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <AirOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Gió</Box>
                  <Box className="admin-weather-metric-value">
                    {weather ? `${weather.windKmh} km/h` : "—"}
                  </Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <WbSunnyOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">UV Index</Box>
                  <Box className="admin-weather-metric-value">
                    {weather ? uvLabel(weather.uvIndex) : "—"}
                  </Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <UmbrellaOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Mưa</Box>
                  <Box className="admin-weather-metric-value">
                    {weather ? `${weather.rainChancePercent}%` : "—"}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className="admin-weather-ai-tip">
              <img
                src="/images/ai-robot-helper-mascot.png"
                onError={(e) => {
                  e.currentTarget.src = "/images/mascot.png";
                }}
                alt="AI Mascot"
                className="admin-weather-ai-tip-mascot"
              />
              <Box>
                <strong>AI gợi ý:</strong>{" "}
                {aiTipLoading && !aiTip
                  ? "Đang soạn gợi ý theo thời tiết…"
                  : aiTip ||
                    (weatherLoading
                      ? "Chờ dữ liệu thời tiết…"
                      : "Thời tiết ổn — dạy theo kế hoạch hôm nay.")}
                {aiTipLoading && aiTip ? (
                  <Typography
                    component="span"
                    sx={{ display: "block", mt: 0.5, fontSize: "0.72rem", opacity: 0.8 }}
                  >
                    Đang làm mới gợi ý AI…
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            gridColumn: { xs: "1", lg: "1" },
            gridRow: { xs: "3", lg: "2" },
          }}
        >
          <Grid container spacing={{ xs: 0.75, sm: 2 }}>
            <Grid size={{ xs: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#eef2ff", color: "#4f46e5" }}>
                    <SchoolOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">
                    {loading ? <Skeleton width={36} /> : classesToday}
                  </Box>
                  <Box className="admin-stat-label">Lớp học hôm nay</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewSchedule}>
                  Xem chi tiết <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#ecfdf5", color: "#059669" }}>
                    <GroupOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">
                    {loading ? <Skeleton width={48} /> : studentCount}
                  </Box>
                  <Box className="admin-stat-label">Học sinh</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewUsers}>
                  Xem danh sách <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            {/* Thay "Bài tập cần chấm" — chưa có grading API */}
            <Grid size={{ xs: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#fff7ed", color: "#ea580c" }}>
                    <PersonSearchOutlinedIcon />
                    {atRiskCount > 0 ? <Box className="admin-stat-badge-dot" /> : null}
                  </Box>
                  <Box className="admin-stat-value">
                    {loading ? <Skeleton width={36} /> : atRiskCount}
                  </Box>
                  <Box className="admin-stat-label">HS cần hỗ trợ</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewSupport}>
                  Xem ngay <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            {/* Thay "Tỷ lệ tham gia" — chưa có attendance API */}
            <Grid size={{ xs: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#fdf2f8", color: "#db2777" }}>
                    <ClassOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">
                    {loading ? <Skeleton width={36} /> : classroomCount}
                  </Box>
                  <Box className="admin-stat-label">Lớp đang quản lý</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewClassrooms}>
                  Quản lý lớp <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* SECTION 2 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <CalendarMonthOutlinedIcon sx={{ color: "#2563eb" }} />
                Lịch dạy hôm nay
              </Box>
              <Box className="admin-panel-action-btn" onClick={handleViewSchedule}>
                Xem lịch đầy đủ
              </Box>
            </Box>

            <Box className="admin-schedule-list">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={64} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              ) : visibleSessions.length === 0 ? (
                <Box className="admin-schedule-empty">
                  <img
                    src="/images/empty_schedule.png"
                    alt="No schedule illustration"
                    className="admin-schedule-empty__image"
                  />
                  <Typography className="admin-schedule-empty__title">
                    Hôm nay bạn chưa có ca dạy nào
                  </Typography>
                  <Typography className="admin-schedule-empty__desc">
                    Bạn có thể tạo một ca dạy mới để bắt đầu ngày làm việc hiệu quả.
                  </Typography>
                  <Box className="admin-schedule-empty__actions">
                    <Button
                      variant="contained"
                      className="admin-schedule-empty__btn-primary"
                      onClick={handleViewSchedule}
                      startIcon={<AddIcon />}
                    >
                      Tạo ca dạy mới
                    </Button>
                    <Button
                      variant="text"
                      className="admin-schedule-empty__btn-secondary"
                      onClick={() => navigate(`/${paths.ADMIN}/${paths.DOCS}`)}
                    >
                      Xem hướng dẫn
                    </Button>
                  </Box>
                </Box>
              ) : (
                visibleSessions.map((session) => {
                  const status = sessionStatusLabel(session);
                  const canCamera =
                    session.canJoinMeet ||
                    session.canStartOnlineClass ||
                    session.needsSetup;
                  const starting = startingId === session.id;
                  const shortLabel = classroomShortLabel(session);
                  return (
                    <Box className="admin-schedule-row" key={session.id}>
                      <Box className="admin-schedule-time">
                        <span className="admin-schedule-time-start">
                          {session.startAt ? dayjs(session.startAt).format("HH:mm") : "00:00"}
                        </span>
                        <span className="admin-schedule-time-end">
                          - {session.endAt ? dayjs(session.endAt).format("HH:mm") : "00:00"}
                        </span>
                      </Box>
                      <Box
                        className={`admin-schedule-badge admin-schedule-badge--${badgeVariant(shortLabel)}`}
                      >
                        {shortLabel}
                      </Box>
                      <Box className="admin-schedule-info">
                        <Box className="admin-schedule-title">
                          {session.classroomName || session.title}
                        </Box>
                        <Box className="admin-schedule-sub">
                          {session.lessonTitle || session.title}
                        </Box>
                      </Box>
                      <span
                        className={`admin-schedule-status-pill${
                          status.active ? " admin-schedule-status-pill--active" : " admin-schedule-status-pill--pending"
                        }`}
                      >
                        {status.active ? (
                          <VideocamOutlinedIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />
                        )}
                        {status.text}
                      </span>
                      {canCamera ? (
                        <Button
                          size="small"
                          variant="contained"
                          className="admin-schedule-btn admin-schedule-btn--active"
                          disabled={starting}
                          onClick={() => handleSessionCamera(session)}
                        >
                          {session.canJoinMeet ? "Vào lớp" : starting ? "Đang mở…" : "Bắt đầu"}
                        </Button>
                      ) : null}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Bài tập sắp đến hạn */}
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header" sx={{ borderBottom: "none", pb: 1 }}>
              <Box className="admin-panel-title">
                <AssignmentTurnedInOutlinedIcon sx={{ color: "#ef4444" }} />
                Bài tập sắp đến hạn
              </Box>
              <Box className="admin-panel-action-btn" onClick={handleViewVocabSets}>
                Xem tất cả &gt;
              </Box>
            </Box>

            {!loading && upcomingAssignmentCount > 0 ? (
              <Box className="admin-assignment-top-banner">
                <Box className="admin-assignment-top-banner__left">
                  <Box className="admin-assignment-top-banner__icon-box">
                    <AccessTimeOutlinedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Box className="admin-assignment-top-banner__title">
                      Có {upcomingAssignmentCount} bài tập sắp đến hạn
                    </Box>
                    <Box className="admin-assignment-top-banner__sub">
                      trong 14 ngày tới
                    </Box>
                  </Box>
                </Box>
                <Button
                  className="admin-assignment-top-banner__btn"
                  variant="contained"
                  onClick={handleViewVocabSets}
                >
                  Xem danh sách
                </Button>
              </Box>
            ) : null}

            <Box className="admin-assignments-list">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={56} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              ) : assignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, px: 3, textAlign: "center" }}>
                  Không có bài tập sắp đến hạn trong 14 ngày tới.
                </Typography>
              ) : (
                assignments.map((a) => {
                  const dueBadge = assignmentDueBadge(a.dueAt);
                  return (
                    <Box className="admin-assignment-row-redesign" key={a.id} onClick={handleViewVocabSets}>
                      <Box
                        className="admin-assignment-icon-box-redesign"
                        sx={{ bgcolor: "#f3e8ff", color: "#a855f7" }}
                      >
                        <AssignmentOutlinedIcon fontSize="small" />
                      </Box>
                      <Box className="admin-assignment-info-redesign">
                        <Box className="admin-assignment-title-redesign">
                          {a.vocabularySetTitle || "Bộ từ vựng"}
                        </Box>
                        <Box className="admin-assignment-sub-redesign">
                          {a.classroomName || "Lớp"}
                          {a.dueAt ? ` • Hạn: ${dayjs(a.dueAt).format("DD/MM/YYYY")}` : ""}
                        </Box>
                      </Box>
                      <Box className="admin-assignment-right-side">
                        {dueBadge ? (
                          <span
                            className={`admin-assignment-badge admin-assignment-badge--${dueBadge.kind}`}
                          >
                            {dueBadge.label}
                          </span>
                        ) : null}
                        <ChevronRightOutlinedIcon className="admin-assignment-chevron" fontSize="small" />
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Hoạt động gần đây — tạm placeholder, chưa map nghiệp vụ lớp học */}
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <InfoOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
                Hoạt động gần đây
              </Box>
              <Box
                className="admin-panel-action-btn"
                onClick={() => navigate(`/${paths.ADMIN}/${paths.ACTIVITY_LOGS}`)}
              >
                Log hệ thống
              </Box>
            </Box>
            <Box className="admin-activities-empty-redesign">
              <Box className="admin-activities-empty__left">
                <img
                  src="/images/empty_activities.png"
                  alt="No activities illustration"
                  className="admin-activities-empty__image-redesign"
                />
              </Box>
              <Box className="admin-activities-empty__right">
                <Typography className="admin-activities-empty__title-redesign">
                  Chưa có hoạt động nào
                </Typography>
                <Typography className="admin-activities-empty__desc-redesign">
                  Các hoạt động như tạo bài học, giao bài tập, học sinh làm bài, bình luận... sẽ hiển thị tại đây.
                </Typography>
                <Button
                  variant="outlined"
                  className="admin-activities-empty__btn-outlined"
                  onClick={() => navigate(`/${paths.ADMIN}/${paths.ACTIVITY_LOGS}`)}
                >
                  Tạo hoạt động đầu tiên
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 4.5 }}>
          <CommunityVoiceWidget
            onAddFeedback={() => setInnovationDrawerOpen(true)}
            refreshKey={communityVoiceRefresh}
          />

          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <GroupOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
                Học sinh cần hỗ trợ
              </Box>
              <Box className="admin-panel-action-btn" onClick={handleViewSupport}>
                Xem tất cả
              </Box>
            </Box>

            <Box className="admin-support-list">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={56} sx={{ mb: 1, borderRadius: 2 }} />
                ))
              ) : supportItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Không có học sinh cần hỗ trợ lúc này.
                </Typography>
              ) : (
                supportItems.map((item) => (
                  <Box
                    className="admin-support-row"
                    key={`${item.studentId}-${item.classroomId}`}
                    sx={{ cursor: "pointer" }}
                    onClick={handleViewSupport}
                  >
                    <Avatar
                      className="admin-support-avatar"
                      src={item.avatarUrl || undefined}
                      sx={{ bgcolor: "#fee2e2", color: "#ef4444" }}
                    >
                      {supportInitials(item.studentName)}
                    </Avatar>
                    <Box className="admin-support-info">
                      <Box className="admin-support-name">{item.studentName}</Box>
                      <Box className="admin-support-reason">
                        {item.classroomName} • {item.primaryReason}
                      </Box>
                    </Box>
                    <Box className="admin-support-bar-container">
                      <Box className="admin-support-bar-bg">
                        <Box
                          className={`admin-support-bar-fill ${supportBarClass(item.riskLevel)}`}
                          sx={{ width: `${Math.min(100, Math.max(8, item.riskScore))}%` }}
                        />
                      </Box>
                      <Box className="admin-support-percent">{Math.round(item.riskScore)}%</Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box className="admin-fab-wrap">
        <Button
          className="admin-fab"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleViewClassrooms}
        >
          Tạo nhanh lớp
        </Button>
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
      <InnovationSubmitDrawer
        open={innovationDrawerOpen}
        onClose={() => setInnovationDrawerOpen(false)}
        onSuccess={() => setCommunityVoiceRefresh((k) => k + 1)}
      />
    </Box>
  );
}
