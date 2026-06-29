import {
  Avatar,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { StudentSupportItem } from "../../../shared/api/studentSupport";
import { initialsFromDisplayName } from "../../../student/shared/auth/studentInitials";
import { riskLevelColors, riskLevelLabel } from "./studentSupportUtils";
import { StudentSupportTrendSparkline } from "./StudentSupportTrendSparkline";

type Props = {
  rows: StudentSupportItem[];
  onViewProfile: (item: StudentSupportItem) => void;
  compact?: boolean;
};

function scoreTone(value?: number | null): "low" | "mid" | "ok" {
  if (value == null) return "ok";
  if (value < 50) return "low";
  if (value < 70) return "mid";
  return "ok";
}

function avatarColor(name: string): { bg: string; color: string } {
  const palette = [
    { bg: "#dbeafe", color: "#2563eb" },
    { bg: "#f3e8ff", color: "#9333ea" },
    { bg: "#dcfce7", color: "#16a34a" },
    { bg: "#ffedd5", color: "#ea580c" },
  ];
  const index = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

export function StudentSupportTable({ rows, onViewProfile, compact = false }: Props) {
  if (rows.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">Không có học sinh khớp bộ lọc.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <Table size="small" className="student-support-table">
        <TableHead>
          <TableRow>
            <TableCell>Học sinh</TableCell>
            <TableCell>Trạng thái Risk</TableCell>
            <TableCell align="center">Inactive</TableCell>
            {!compact ? <TableCell align="center">Missing</TableCell> : null}
            <TableCell align="center">Điểm AVG</TableCell>
            <TableCell className="student-support-col-trend">Xu hướng</TableCell>
            <TableCell className="student-support-col-reason">Lý do chính</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const colors = riskLevelColors(row.riskLevel);
            const avatar = avatarColor(row.studentName);
            const scoreClass = scoreTone(row.avgScorePercent);

            return (
              <TableRow key={`${row.studentId}-${row.classroomId}`} hover>
                <TableCell>
                  <Box className="student-support-student-cell">
                    <Avatar
                      src={row.avatarUrl || undefined}
                      className="student-support-student-avatar"
                      sx={{ bgcolor: avatar.bg, color: avatar.color }}
                    >
                      {initialsFromDisplayName(row.studentName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography className="student-support-student-name" noWrap>
                        {row.studentName}
                      </Typography>
                      <Typography className="student-support-student-class" noWrap>
                        {row.classroomName}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <span
                    className="student-support-risk-badge"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }}
                  >
                    <span className="student-support-risk-badge-dot" style={{ background: colors.text }} />
                    {riskLevelLabel(row.riskLevel)} ({row.riskScore})
                  </span>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 500, color: "#334155" }}>
                  {row.inactiveDays > 0 ? `${row.inactiveDays} ngày` : "—"}
                </TableCell>
                {!compact ? (
                  <TableCell align="center" sx={{ fontWeight: 500, color: "#334155" }}>
                    {row.missingAssignments}
                  </TableCell>
                ) : null}
                <TableCell align="center">
                  {row.avgScorePercent != null ? (
                    <span className={`student-support-score-pill student-support-score-pill--${scoreClass}`}>
                      {row.avgScorePercent}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="student-support-col-trend">
                  <StudentSupportTrendSparkline trendPercent={row.scoreTrendPercent} />
                </TableCell>
                <TableCell className="student-support-col-reason">
                  <Typography
                    variant="body2"
                    sx={{ maxWidth: compact ? 160 : 220, color: "#64748b", fontSize: "0.75rem" }}
                    noWrap
                    title={row.primaryReason}
                  >
                    {row.primaryReason || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    className="student-support-view-btn"
                    onClick={() => onViewProfile(row)}
                  >
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
