import {
  Avatar,
  Box,
  Button,
  Chip,
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
import { formatTrendPercent, riskLevelColors, riskLevelLabel } from "./studentSupportUtils";

type Props = {
  rows: StudentSupportItem[];
  onViewProfile: (item: StudentSupportItem) => void;
};

export function StudentSupportTable({ rows, onViewProfile }: Props) {
  if (rows.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">Không có học sinh khớp bộ lọc.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small" className="admin-activity-table">
        <TableHead>
          <TableRow>
            <TableCell>Học sinh</TableCell>
            <TableCell>Risk</TableCell>
            <TableCell align="right">Inactive</TableCell>
            <TableCell align="right">Missing</TableCell>
            <TableCell align="right">Avg</TableCell>
            <TableCell align="right">Trend</TableCell>
            <TableCell>Lý do</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const colors = riskLevelColors(row.riskLevel);
            return (
              <TableRow key={`${row.studentId}-${row.classroomId}`} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 160 }}>
                    <Avatar
                      src={row.avatarUrl || undefined}
                      sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "var(--ac-primary-fixed)", color: "var(--ac-primary)" }}
                    >
                      {initialsFromDisplayName(row.studentName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {row.studentName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.classroomName}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={`${riskLevelLabel(row.riskLevel)} (${row.riskScore})`}
                    sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">{row.inactiveDays}</TableCell>
                <TableCell align="right">{row.missingAssignments}</TableCell>
                <TableCell align="right">{row.avgScorePercent != null ? `${row.avgScorePercent}%` : "—"}</TableCell>
                <TableCell align="right">{formatTrendPercent(row.scoreTrendPercent)}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={row.primaryReason}>
                    {row.primaryReason || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => onViewProfile(row)}>
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
