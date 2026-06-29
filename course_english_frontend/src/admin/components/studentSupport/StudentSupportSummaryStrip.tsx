import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Skeleton, Typography } from "@mui/material";
import type { StudentSupportSummary } from "../../../shared/api/studentSupport";

type Props = {
  summary: StudentSupportSummary | null;
  loading?: boolean;
};

const SUMMARY_CARDS = [
  {
    key: "criticalCount" as const,
    label: "Critical",
    sublabel: "Nguy cấp",
    tone: "critical" as const,
    labelColor: "#dc2626",
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    Icon: ReportProblemOutlinedIcon,
  },
  {
    key: "warningCount" as const,
    label: "Warning",
    sublabel: "Cảnh báo",
    tone: "warning" as const,
    labelColor: "#ea580c",
    iconBg: "#fff7ed",
    iconColor: "#f97316",
    Icon: WarningAmberOutlinedIcon,
  },
  {
    key: "attentionCount" as const,
    label: "Attention",
    sublabel: "Chú ý",
    tone: "attention" as const,
    labelColor: "#d97706",
    iconBg: "#fffbeb",
    iconColor: "#f59e0b",
    Icon: VisibilityOutlinedIcon,
  },
];

export function StudentSupportSummaryStrip({ summary, loading = false }: Props) {
  return (
    <Box className="student-support-summary-grid">
      {SUMMARY_CARDS.map((card) => (
        <Box
          key={card.key}
          className={`student-support-summary-card student-support-summary-card--${card.tone}`}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography className="student-support-summary-card-label" sx={{ color: card.labelColor }}>
                {card.label} ({card.sublabel})
              </Typography>
              {loading ? (
                <Skeleton width={48} height={44} sx={{ mt: 0.5 }} />
              ) : (
                <Typography className="student-support-summary-card-value">
                  {summary?.[card.key] ?? 0}
                </Typography>
              )}
            </Box>
            <Box
              className="student-support-summary-card-icon"
              sx={{ bgcolor: card.iconBg, color: card.iconColor }}
            >
              <card.Icon fontSize="small" />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
