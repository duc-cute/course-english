import {
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { StudentSupportItem } from "../../../shared/api/studentSupport";
import { initialsFromDisplayName } from "../../../student/shared/auth/studentInitials";
import { riskLevelColors, riskLevelLabel } from "./studentSupportUtils";

type Props = {
  item: StudentSupportItem;
  onViewProfile: () => void;
};

export function StudentSupportCard({ item, onViewProfile }: Props) {
  const colors = riskLevelColors(item.riskLevel);

  return (
    <Box
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        bgcolor: "#fff",
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          src={item.avatarUrl || undefined}
          sx={{ width: 44, height: 44, bgcolor: "var(--ac-primary-fixed)", color: "var(--ac-primary)" }}
        >
          {initialsFromDisplayName(item.studentName)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>
            {item.studentName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {item.classroomName}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={riskLevelLabel(item.riskLevel)}
          sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 700 }}
        />
      </Stack>

      {item.primaryReason ? (
        <Chip
          size="small"
          variant="outlined"
          label={item.primaryReason}
          sx={{ alignSelf: "flex-start", maxWidth: "100%" }}
        />
      ) : null}

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {item.inactiveDays > 7 ? (
          <Typography variant="caption" color="text.secondary">
            No activity: {item.inactiveDays} days
          </Typography>
        ) : null}
        {item.missingAssignments > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {item.missingAssignments} missing
          </Typography>
        ) : null}
        {item.avgScorePercent != null ? (
          <Typography variant="caption" color="text.secondary">
            Avg {item.avgScorePercent}%
          </Typography>
        ) : null}
      </Stack>

      <Box sx={{ mt: "auto", pt: 0.5 }}>
        <Button size="small" variant="outlined" onClick={onViewProfile} fullWidth>
          View Profile
        </Button>
      </Box>
    </Box>
  );
}
