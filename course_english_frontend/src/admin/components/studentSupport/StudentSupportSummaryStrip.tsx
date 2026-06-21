import { Box, Grid, Typography } from "@mui/material";
import type { StudentSupportSummary } from "../../../shared/api/studentSupport";

type Props = {
  summary: StudentSupportSummary | null;
};

const STRIP_ITEMS = [
  { key: "criticalCount" as const, label: "Critical", bg: "#FDECEC", color: "#B42318", border: "#F9C6C6" },
  { key: "warningCount" as const, label: "Warning", bg: "#FFF4E5", color: "#B54708", border: "#F9DBAF" },
  { key: "attentionCount" as const, label: "Attention", bg: "#FFFAEB", color: "#92700C", border: "#FEEFC6" },
];

export function StudentSupportSummaryStrip({ summary }: Props) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {STRIP_ITEMS.map((item) => (
        <Grid key={item.key} size={{ xs: 12, sm: 4 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${item.border}`,
              bgcolor: item.bg,
            }}
          >
            <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, textTransform: "uppercase" }}>
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: item.color, mt: 0.5 }}>
              {summary?.[item.key] ?? 0}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
