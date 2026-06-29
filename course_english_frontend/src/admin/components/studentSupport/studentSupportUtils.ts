import type { StudentSupportRiskLevel } from "../../../shared/api/studentSupport";

const RISK_COLORS: Record<StudentSupportRiskLevel, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "#FDECEC", text: "#B42318", border: "#F9C6C6" },
  WARNING: { bg: "#FFF4E5", text: "#B54708", border: "#F9DBAF" },
  ATTENTION: { bg: "#FFFAEB", text: "#92700C", border: "#FEEFC6" },
};

const RISK_LABELS: Record<StudentSupportRiskLevel, string> = {
  CRITICAL: "Critical",
  WARNING: "Warning",
  ATTENTION: "Attention",
};

export function riskLevelLabel(level: StudentSupportRiskLevel): string {
  return RISK_LABELS[level] ?? level;
}

export function riskLevelColors(level: StudentSupportRiskLevel) {
  return RISK_COLORS[level] ?? RISK_COLORS.ATTENTION;
}

export function formatTrendPercent(value?: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function riskSeverityLabel(level: StudentSupportRiskLevel): string {
  const map: Record<StudentSupportRiskLevel, string> = {
    CRITICAL: "Mức nguy cấp",
    WARNING: "Mức cao",
    ATTENTION: "Cần chú ý",
  };
  return map[level] ?? level;
}
