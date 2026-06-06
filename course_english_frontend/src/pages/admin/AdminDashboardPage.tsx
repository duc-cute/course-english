import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { paths } from "../../shared/constants/paths";

/** Số liệu mẫu — thay bằng API khi backend có endpoint dashboard */
const STATS = [
  {
    label: "Tổng lớp học",
    value: "8",
    delta: "+12% so với tháng trước",
    deltaColor: "var(--ac-secondary)",
    icon: <MeetingRoomOutlinedIcon />,
    iconBg: "var(--ac-primary-fixed)",
    iconColor: "var(--ac-primary)",
  },
  {
    label: "Tổng học sinh",
    value: "156",
    delta: "+4% học sinh mới",
    deltaColor: "var(--ac-secondary)",
    icon: <GroupOutlinedIcon />,
    iconBg: "var(--ac-secondary-fixed)",
    iconColor: "var(--ac-on-secondary-container)",
  },
  {
    label: "Tổng môn học",
    value: "42",
    delta: "8 module",
    deltaColor: "var(--ac-outline)",
    icon: <SchoolOutlinedIcon />,
    iconBg: "var(--ac-tertiary-fixed)",
    iconColor: "var(--ac-on-tertiary-fixed-variant)",
  },
  {
    label: "Đã duyệt tài liệu",
    value: "35",
    delta: "83.3% tỷ lệ",
    deltaColor: "var(--ac-primary)",
    icon: <CheckCircleOutlinedIcon />,
    iconBg: "var(--ac-surface-container-high)",
    iconColor: "var(--ac-primary)",
  },
] as const;

const BAR_HEIGHTS = [60, 45, 85, 30, 55, 70, 40];
const BAR_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const RECENT_ACTIVITY = [
  {
    activity: "Ghi danh học sinh mới",
    entity: "Nguyễn Văn A (Toán 101)",
    time: "2 phút trước",
    status: "success" as const,
    icon: <PersonAddOutlinedIcon fontSize="small" />,
    iconBg: "var(--ac-secondary-container)",
    iconColor: "var(--ac-on-secondary-container)",
    actionIcon: <VisibilityOutlinedIcon fontSize="small" />,
  },
  {
    activity: "Cập nhật môn học",
    entity: "Giới thiệu tế bào",
    time: "1 giờ trước",
    status: "draft" as const,
    icon: <EditOutlinedIcon fontSize="small" />,
    iconBg: "var(--ac-primary-fixed)",
    iconColor: "var(--ac-primary)",
    actionIcon: <EditOutlinedIcon fontSize="small" />,
  },
  {
    activity: "Nộp tài liệu",
    entity: "Trần Thị B (Sinh học)",
    time: "3 giờ trước",
    status: "pending" as const,
    icon: <AssignmentTurnedInOutlinedIcon fontSize="small" />,
    iconBg: "var(--ac-tertiary-fixed)",
    iconColor: "var(--ac-on-tertiary-fixed-variant)",
    actionIcon: <AssignmentTurnedInOutlinedIcon fontSize="small" />,
  },
];

const STATUS_LABEL: Record<(typeof RECENT_ACTIVITY)[number]["status"], string> = {
  success: "Thành công",
  draft: "Nháp",
  pending: "Chờ duyệt",
};

export function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <Box className="admin-dashboard-wrap">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATS.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box className="admin-stat-card">
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: stat.iconBg,
                    color: stat.iconColor,
                    display: "flex",
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="caption" sx={{ color: stat.deltaColor, fontWeight: 700 }}>
                  {stat.delta}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "var(--ac-on-surface-variant)", textTransform: "uppercase", display: "block", mb: 0.5 }}
              >
                {stat.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "var(--ac-on-surface)" }}>
                {stat.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box className="admin-panel-card" sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Hoạt động bài học
              </Typography>
              <Stack direction="row" spacing={1}>
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: "var(--ac-surface-container)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Tuần
                </Box>
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--ac-on-surface-variant)",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "var(--ac-surface-container)" },
                  }}
                >
                  Tháng
                </Box>
              </Stack>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, height: 256, px: 2 }}>
              {BAR_HEIGHTS.map((h, i) => (
                <Box
                  key={BAR_LABELS[i]}
                  className={`admin-chart-bar ${h === 85 ? "is-peak" : ""}`}
                  sx={{ height: `${h}%` }}
                  title={BAR_LABELS[i]}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, px: 2 }}>
              {BAR_LABELS.map((label) => (
                <Typography key={label} variant="caption" sx={{ color: "var(--ac-outline)" }}>
                  {label}
                </Typography>
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Box className="admin-panel-card" sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Mức độ tham gia
            </Typography>
            <Box sx={{ flex: 1, position: "relative", minHeight: 160 }}>
              <svg viewBox="0 0 200 100" width="100%" height="100%" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="engagementGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#004ac6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#004ac6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 Q30,70 60,85 T120,40 T180,20 L200,20 L200,100 L0,100 Z"
                  fill="url(#engagementGrad)"
                />
                <path
                  d="M0,80 Q30,70 60,85 T120,40 T180,20 L200,20"
                  fill="none"
                  stroke="#004ac6"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <circle cx={120} cy={40} r={4} fill="#fff" stroke="#004ac6" strokeWidth={2} />
              </svg>
              <Box
                sx={{
                  position: "absolute",
                  top: "40%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: "0.75rem",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  boxShadow: 2,
                  whiteSpace: "nowrap",
                }}
              >
                Đỉnh: 94%
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--ac-outline-variant)" }}>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Phiên TB
                </Typography>
                <Typography fontWeight={700}>4.2 giờ</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Tỷ lệ hoàn thành
                </Typography>
                <Typography fontWeight={700}>92%</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Box className="admin-panel-card" sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid var(--ac-outline-variant)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Hoạt động gần đây
          </Typography>
          <Button size="small" sx={{ fontWeight: 700, textTransform: "none" }}>
            Xem tất cả
          </Button>
        </Box>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table className="admin-activity-table" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Hoạt động</TableCell>
                <TableCell>Đối tượng</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {RECENT_ACTIVITY.map((row) => (
                <TableRow key={row.activity + row.time} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          bgcolor: row.iconBg,
                          color: row.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {row.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {row.activity}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.entity}</TableCell>
                  <TableCell sx={{ color: "var(--ac-on-surface-variant)" }}>{row.time}</TableCell>
                  <TableCell>
                    <span className={`admin-status-chip admin-status-chip--${row.status}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" aria-label="Chi tiết">
                      {row.actionIcon}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Button
        className="admin-fab"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => navigate(`/${paths.ADMIN}/${paths.MANAGE_CLASSROOM}`)}
      >
        Tạo nhanh
      </Button>
    </Box>
  );
}
