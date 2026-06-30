import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Box, Skeleton, Typography } from "@mui/material";
import type { QuestionStatsRecord } from "../../../shared/api/question";

type QuestionBankStatsRowProps = {
  stats: QuestionStatsRecord | null;
  loading?: boolean;
};

type StatCardProps = {
  icon: React.ReactNode;
  value: number | string;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Box className="qb-stat-card">
      <Box className="qb-stat-card__icon-row">
        <Box className="qb-stat-card__icon" aria-hidden>
          {icon}
        </Box>
      </Box>
      <Typography className="qb-stat-card__value">{value}</Typography>
      <Typography className="qb-stat-card__label">{label}</Typography>
    </Box>
  );
}

export function QuestionBankStatsRow({ stats, loading }: QuestionBankStatsRowProps) {
  if (loading && !stats) {
    return (
      <Box className="qb-stats-row">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: "14px" }} />
        ))}
      </Box>
    );
  }

  const byStatus = stats?.byStatus ?? {};
  const byType = stats?.byType ?? {};

  return (
    <Box className="qb-stats-row">
      <StatCard icon={<StorageOutlinedIcon fontSize="small" />} value={stats?.total ?? 0} label="Tổng câu hỏi" />
      <StatCard
        icon={<CheckCircleOutlineIcon fontSize="small" />}
        value={byStatus.PUBLISHED ?? 0}
        label="Published"
      />
      <StatCard icon={<EditNoteOutlinedIcon fontSize="small" />} value={byStatus.DRAFT ?? 0} label="Nháp" />
      <StatCard
        icon={<QuizOutlinedIcon fontSize="small" />}
        value={byType.MULTIPLE_CHOICE ?? 0}
        label="MCQ"
      />
      <StatCard
        icon={<FactCheckOutlinedIcon fontSize="small" />}
        value={byType.TRUE_FALSE ?? 0}
        label="Đúng / Sai"
      />
      <StatCard
        icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
        value={stats?.aiGeneratedCount ?? 0}
        label="AI Generated"
      />
    </Box>
  );
}
