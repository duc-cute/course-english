import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
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

import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { paths } from "../../shared/constants/paths";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { displayName } = useStudentAccountProfile();
  const teacherName = displayName || "David";

  // Navigation handlers
  const handleViewSchedule = () => navigate(`/${paths.ADMIN}/${paths.SCHEDULE}`);
  const handleViewSupport = () => navigate(`/${paths.ADMIN}/${paths.STUDENTS_NEED_SUPPORT}`);
  const handleViewUsers = () => navigate(`/${paths.ADMIN}/${paths.MANAGE_USER}`);

  return (
    <Box className="admin-dashboard-wrap" sx={{ width: "100%", pb: 4 }}>
      
      {/* SECTION 1: Welcome Banner & Stats (Left) + Weather Widget (Right) */}
      <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
        
        {/* Left Column: Welcome Card & Stats Row */}
        <Grid size={{ xs: 12, lg: 7.5 }} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          
          {/* Welcome Card */}
          <Box className="admin-welcome-card" sx={{ flexGrow: 1 }}>
            <Box className="admin-welcome-card-content">
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ color: "var(--ac-on-surface)", mb: 1, fontSize: { xs: "1.75rem", sm: "2.25rem" } }}
              >
                Chào buổi sáng, {teacherName}! 👋
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ color: "var(--ac-on-surface-variant)", lineHeight: 1.5, fontSize: "1rem" }}
              >
                Mỗi ngày là một cơ hội để truyền cảm hứng cho học sinh.
              </Typography>
            </Box>
            
            {/* High-Fidelity 3D Welcome Illustration Image */}
            <Box className="admin-welcome-card-graphic" sx={{ display: { xs: "none", sm: "flex" } }}>
              <img 
                src="/images/dashboard_welcome_3d.png" 
                alt="Welcome 3D illustration" 
                style={{ width: "160px", height: "140px", objectFit: "contain" }}
              />
            </Box>
          </Box>

          {/* 4 Stats Cards */}
          <Grid container spacing={2}>
            {/* Card 1: Classes */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#eef2ff", color: "#4f46e5" }}>
                    <SchoolOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">4</Box>
                  <Box className="admin-stat-label">Lớp học hôm nay</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewSchedule}>
                  Xem chi tiết <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            {/* Card 2: Students */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#ecfdf5", color: "#059669" }}>
                    <GroupOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">126</Box>
                  <Box className="admin-stat-label">Học sinh</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewUsers}>
                  Xem danh sách <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            {/* Card 3: Grade Assignments */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#fff7ed", color: "#ea580c" }}>
                    <AssignmentTurnedInOutlinedIcon />
                    <Box className="admin-stat-badge-dot" />
                  </Box>
                  <Box className="admin-stat-value">12</Box>
                  <Box className="admin-stat-label">Bài tập cần chấm</Box>
                </Box>
                <Box className="admin-stat-link" onClick={handleViewSupport}>
                  Chấm ngay <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            </Grid>

            {/* Card 4: Attendance Rate */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box className="admin-stat-card-redesign">
                <Box>
                  <Box className="admin-stat-icon-wrapper" sx={{ bgcolor: "#fdf2f8", color: "#db2777" }}>
                    <TrendingUpOutlinedIcon />
                  </Box>
                  <Box className="admin-stat-value">92%</Box>
                  <Box className="admin-stat-label">Tỷ lệ tham gia</Box>
                </Box>
                <Box className="admin-stat-link" sx={{ cursor: "default", pointerEvents: "none", opacity: 0.7 }}>
                  Tuần này
                </Box>
              </Box>
            </Grid>
          </Grid>

        </Grid>

        {/* Right Column: Weather Card */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <Box className="admin-weather-card">
            {/* High-Fidelity Skyline City Weather Background Image */}
            <img 
              src="/images/dashboard_weather_bg.png" 
              alt="Weather skyline background" 
              className="admin-weather-bg-sky" 
              style={{ objectFit: "cover" }}
            />

            <Box className="admin-weather-header">
              <Box className="admin-weather-location">
                <PlaceOutlinedIcon fontSize="inherit" />
                Hà Nội, Việt Nam
              </Box>
              <IconButton size="small" sx={{ color: "white" }} aria-label="Xem thêm">
                <MoreHorizOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box className="admin-weather-body">
              <Box className="admin-weather-temp-box">
                <Box className="admin-weather-temp">31°C</Box>
                <Box className="admin-weather-sky-text">Sunny</Box>
                <Box className="admin-weather-feels">Cảm giác như 34°C</Box>
              </Box>

              <Box className="admin-weather-metrics">
                <Box className="admin-weather-metric-item">
                  <OpacityOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Độ ẩm</Box>
                  <Box className="admin-weather-metric-value">70%</Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <AirOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Gió</Box>
                  <Box className="admin-weather-metric-value">12 km/h</Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <WbSunnyOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">UV Index</Box>
                  <Box className="admin-weather-metric-value">7 (Cao)</Box>
                </Box>
                <Box className="admin-weather-metric-item">
                  <UmbrellaOutlinedIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.8 }} />
                  <Box className="admin-weather-metric-label">Mưa</Box>
                  <Box className="admin-weather-metric-value">0%</Box>
                </Box>
              </Box>
            </Box>

            <Box className="admin-weather-ai-tip">
              <img 
                src="/images/ai-robot-helper-mascot.png" 
                onError={(e) => { e.currentTarget.src = "/images/mascot.png"; }}
                alt="AI Mascot" 
                className="admin-weather-ai-tip-mascot"
              />
              <Box>
                <strong>AI gợi ý:</strong> Thời tiết đẹp hôm nay! Thích hợp cho các hoạt động speaking hoặc các trò chơi vận động lớp học.
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* SECTION 2: Split columns (Schedule & Activities vs Support & Assignments) */}
      <Grid container spacing={3}>
        {/* Left Column - Schedule & Activity */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          
          {/* List 1: Teaching Schedule */}
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <CalendarMonthOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
                Lịch dạy hôm nay
              </Box>
              <Box className="admin-panel-action-btn" onClick={handleViewSchedule}>
                Xem lịch đầy đủ
              </Box>
            </Box>
            
            <Box className="admin-schedule-list">
              {/* Row 1 */}
              <Box className="admin-schedule-row">
                <Box className="admin-schedule-time">08:00 - 08:45</Box>
                <Box className="admin-schedule-badge admin-schedule-badge--5a">5A</Box>
                <Box className="admin-schedule-info">
                  <Box className="admin-schedule-title">Tiếng Anh 5A</Box>
                  <Box className="admin-schedule-sub">Unit 8: My World</Box>
                </Box>
                <span className="admin-schedule-status-pill admin-schedule-status-pill--active">
                  Đã bắt đầu
                </span>
                <Tooltip title="Vào lớp trực tuyến">
                  <IconButton size="small" className="admin-schedule-action-icon" aria-label="Camera">
                    <VideocamOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Row 2 */}
              <Box className="admin-schedule-row">
                <Box className="admin-schedule-time">09:00 - 09:45</Box>
                <Box className="admin-schedule-badge admin-schedule-badge--6b">6B</Box>
                <Box className="admin-schedule-info">
                  <Box className="admin-schedule-title">Tiếng Anh 6B</Box>
                  <Box className="admin-schedule-sub">Unit 6: Nature</Box>
                </Box>
                <span className="admin-schedule-status-pill admin-schedule-status-pill--pending">
                  Sắp diễn ra
                </span>
                <IconButton size="small" sx={{ color: "text.secondary" }} disabled aria-label="Clock">
                  <AccessTimeOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Row 3 */}
              <Box className="admin-schedule-row">
                <Box className="admin-schedule-time">10:00 - 10:45</Box>
                <Box className="admin-schedule-badge admin-schedule-badge--7a">7A</Box>
                <Box className="admin-schedule-info">
                  <Box className="admin-schedule-title">Tiếng Anh 7A</Box>
                  <Box className="admin-schedule-sub">Unit 5: Travel</Box>
                </Box>
                <span className="admin-schedule-status-pill admin-schedule-status-pill--pending">
                  Sắp diễn ra
                </span>
                <IconButton size="small" sx={{ color: "text.secondary" }} disabled aria-label="Clock">
                  <AccessTimeOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Row 4 */}
              <Box className="admin-schedule-row">
                <Box className="admin-schedule-time">14:00 - 14:45</Box>
                <Box className="admin-schedule-badge admin-schedule-badge--8c">8C</Box>
                <Box className="admin-schedule-info">
                  <Box className="admin-schedule-title">Tiếng Anh 8C</Box>
                  <Box className="admin-schedule-sub">Unit 4: Technology</Box>
                </Box>
                <span className="admin-schedule-status-pill admin-schedule-status-pill--pending">
                  Sắp diễn ra
                </span>
                <IconButton size="small" sx={{ color: "text.secondary" }} disabled aria-label="Clock">
                  <AccessTimeOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* List 2: Recent Activity */}
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <InfoOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
                Hoạt động gần đây
              </Box>
              <Box className="admin-panel-action-btn" onClick={() => navigate(`/${paths.ADMIN}/${paths.ACTIVITY_LOGS}`)}>
                Xem tất cả
              </Box>
            </Box>

            <Box className="admin-activities-list">
              <Box className="admin-activity-row">
                <Box className="admin-activity-icon-box admin-activity-icon-box--blue">
                  <InfoOutlinedIcon fontSize="small" />
                </Box>
                <Box className="admin-activity-info">
                  <Box className="admin-activity-text">
                    Bạn đã tạo mới bài học <strong>&quot;Unit 8: My World&quot;</strong> cho lớp <strong>5A</strong>.
                  </Box>
                  <Box className="admin-activity-time">2 giờ trước</Box>
                </Box>
              </Box>

              <Box className="admin-activity-row">
                <Box className="admin-activity-icon-box admin-activity-icon-box--green">
                  <CheckCircleOutlinedIcon fontSize="small" />
                </Box>
                <Box className="admin-activity-info">
                  <Box className="admin-activity-text">
                    Học sinh lớp <strong>6B</strong> đã hoàn thành bài tập <strong>&quot;Nature Vocabulary&quot;</strong>.
                  </Box>
                  <Box className="admin-activity-time">3 giờ trước</Box>
                </Box>
              </Box>
            </Box>
          </Box>

        </Grid>

        {/* Right Column - Support & Assignments */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          
          {/* List 3: Students Need Support */}
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
              {/* Row 1 */}
              <Box className="admin-support-row">
                <Avatar className="admin-support-avatar" sx={{ bgcolor: "#fee2e2", color: "#ef4444" }}>AT</Avatar>
                <Box className="admin-support-info">
                  <Box className="admin-support-name">Nguyễn Anh Tuấn</Box>
                  <Box className="admin-support-reason">Lớp 5A • Vắng 3 buổi</Box>
                </Box>
                <Box className="admin-support-bar-container">
                  <Box className="admin-support-bar-bg">
                    <Box className="admin-support-bar-fill admin-support-bar-fill--critical" sx={{ width: "85%" }} />
                  </Box>
                  <Box className="admin-support-percent">85%</Box>
                </Box>
              </Box>

              {/* Row 2 */}
              <Box className="admin-support-row">
                <Avatar className="admin-support-avatar" sx={{ bgcolor: "#ffedd5", color: "#ea580c" }}>HN</Avatar>
                <Box className="admin-support-info">
                  <Box className="admin-support-name">Lê Hoàng Nam</Box>
                  <Box className="admin-support-reason">Lớp 6B • Trễ bài tập</Box>
                </Box>
                <Box className="admin-support-bar-container">
                  <Box className="admin-support-bar-bg">
                    <Box className="admin-support-bar-fill admin-support-bar-fill--warning" sx={{ width: "72%" }} />
                  </Box>
                  <Box className="admin-support-percent">72%</Box>
                </Box>
              </Box>

              {/* Row 3 */}
              <Box className="admin-support-row">
                <Avatar className="admin-support-avatar" sx={{ bgcolor: "#fef9c3", color: "#ca8a04" }}>TL</Avatar>
                <Box className="admin-support-info">
                  <Box className="admin-support-name">Phạm Thùy Linh</Box>
                  <Box className="admin-support-reason">Lớp 7A • Điểm số giảm</Box>
                </Box>
                <Box className="admin-support-bar-container">
                  <Box className="admin-support-bar-bg">
                    <Box className="admin-support-bar-fill admin-support-bar-fill--attention" sx={{ width: "60%" }} />
                  </Box>
                  <Box className="admin-support-percent">60%</Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* List 4: Upcoming Assignments */}
          <Box className="admin-panel-card-redesign">
            <Box className="admin-panel-header">
              <Box className="admin-panel-title">
                <AssignmentTurnedInOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
                Bài tập sắp đến hạn
              </Box>
              <Box className="admin-panel-action-btn" onClick={() => navigate(`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`)}>
                Xem tất cả
              </Box>
            </Box>

            <Box className="admin-assignments-list">
              {/* Assignment 1 */}
              <Box className="admin-assignment-row">
                <Box className="admin-assignment-icon-box">
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </Box>
                <Box className="admin-assignment-info">
                  <Box className="admin-assignment-title">Vocabulary Set: Ocean Animals</Box>
                  <Box className="admin-assignment-sub">Lớp 5A • Hạn: 12/07/2026</Box>
                </Box>
                <span className="admin-assignment-badge admin-assignment-badge--today">
                  Hôm nay
                </span>
              </Box>

              {/* Assignment 2 */}
              <Box className="admin-assignment-row">
                <Box className="admin-assignment-icon-box" sx={{ bgcolor: "#ecfdf5", color: "#10b981" }}>
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </Box>
                <Box className="admin-assignment-info">
                  <Box className="admin-assignment-title">Listening Practice: Weather</Box>
                  <Box className="admin-assignment-sub">Lớp 6B • Hạn: 13/07/2026</Box>
                </Box>
                <span className="admin-assignment-badge admin-assignment-badge--soon">
                  1 ngày nữa
                </span>
              </Box>
            </Box>
          </Box>

        </Grid>
      </Grid>

      {/* FAB Create Class */}
      <Box className="admin-fab-wrap">
        <Button
          className="admin-fab"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/${paths.ADMIN}/${paths.MANAGE_CLASSROOM}`)}
        >
          Tạo nhanh lớp
        </Button>
      </Box>

    </Box>
  );
}
