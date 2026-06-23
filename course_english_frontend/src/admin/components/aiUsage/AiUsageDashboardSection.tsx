import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import TokenOutlinedIcon from "@mui/icons-material/TokenOutlined";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGetAiUsageStats, type AiUsageStats } from "../../../shared/api/ai";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatTokenCount(value: number): string {
  return value.toLocaleString("vi-VN");
}

function formatDayLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  return DAY_LABELS[date.getDay()] ?? dateIso.slice(5);
}

function formatDateVi(dateIso: string): string {
  const [year, month, day] = dateIso.split("-");
  return `${day}/${month}/${year}`;
}

export function AiUsageDashboardSection() {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetAiUsageStats();
      setStats(response.data ?? response.result ?? null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được thống kê AI.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartBars = useMemo(() => {
    if (!stats?.last7Days?.length) return [];
    const maxTokens = Math.max(
      1,
      ...stats.last7Days.map((item) => item.promptTokens + item.completionTokens),
    );
    return stats.last7Days.map((item) => {
      const total = item.promptTokens + item.completionTokens;
      const heightPercent = total === 0 ? 0 : Math.max(12, Math.round((total / maxTokens) * 100));
      return {
        date: item.date,
        label: formatDayLabel(item.date),
        height: heightPercent,
        promptTokens: item.promptTokens,
        completionTokens: item.completionTokens,
        total,
        requests: item.requestCount,
      };
    });
  }, [stats]);

  return (
    <Box className="ai-usage-dashboard-section admin-panel-card" sx={{ mb: 3, p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <AutoGraphOutlinedIcon sx={{ color: "var(--ac-primary)" }} />
            <Typography variant="h6" fontWeight={700}>
              Thống kê AI (toàn hệ thống)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Tổng hợp token và lượt chat LinguistAI trên toàn Course English.
          </Typography>
        </Box>
        {stats ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={stats.aiEnabled ? "AI đang bật" : "AI đang tắt"}
              color={stats.aiEnabled ? "success" : "default"}
              variant="outlined"
            />
            <Chip size="small" label={`Model: ${stats.defaultModel}`} variant="outlined" />
          </Stack>
        ) : null}
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Tổng token",
            value: stats ? formatTokenCount(stats.totalTokens) : "—",
            hint: stats
              ? `↑${formatTokenCount(stats.totalPromptTokens)} · ↓${formatTokenCount(stats.totalCompletionTokens)}`
              : "",
            icon: <TokenOutlinedIcon />,
            iconBg: "var(--ac-primary-fixed)",
            iconColor: "var(--ac-primary)",
          },
          {
            label: "Token hôm nay",
            value: stats ? formatTokenCount(stats.todayTokens) : "—",
            hint: stats ? `${formatTokenCount(stats.todayRequests)} tin gửi` : "",
            icon: <AutoGraphOutlinedIcon />,
            iconBg: "var(--ac-secondary-fixed)",
            iconColor: "var(--ac-on-secondary-container)",
          },
          {
            label: "Tổng tin gửi",
            value: stats ? formatTokenCount(stats.totalRequests) : "—",
            hint: stats ? `Giới hạn/người/ngày: ${stats.dailyRequestLimitPerUser}` : "",
            icon: <ChatOutlinedIcon />,
            iconBg: "var(--ac-tertiary-fixed)",
            iconColor: "var(--ac-on-tertiary-fixed-variant)",
          },
          {
            label: "Người dùng AI",
            value: stats ? formatTokenCount(stats.activeUsers) : "—",
            hint: stats ? `${formatTokenCount(stats.totalConversations)} hội thoại` : "",
            icon: <GroupsOutlinedIcon />,
            iconBg: "var(--ac-surface-container-high)",
            iconColor: "var(--ac-primary)",
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box className="admin-stat-card" sx={{ height: "100%" }}>
              {loading ? (
                <Skeleton variant="rounded" height={96} />
              ) : (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: card.iconBg,
                        color: card.iconColor,
                        display: "flex",
                      }}
                    >
                      {card.icon}
                    </Box>
                    {card.hint ? (
                      <Typography variant="caption" sx={{ color: "var(--ac-outline)", fontWeight: 600, textAlign: "right" }}>
                        {card.hint}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--ac-on-surface-variant)", textTransform: "uppercase", display: "block", mb: 0.5 }}
                  >
                    {card.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "var(--ac-on-surface)" }}>
                    {card.value}
                  </Typography>
                </>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ px: { xs: 0, md: 1 } }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
          Token 7 ngày gần nhất
        </Typography>
        {loading ? (
          <Skeleton variant="rounded" height={180} />
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, height: 180, px: 1 }}>
              {chartBars.map((bar) => (
                <Box
                  key={bar.date}
                  sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: bar.total > 0 ? "var(--ac-primary)" : "var(--ac-outline)",
                      fontWeight: bar.total > 0 ? 700 : 400,
                      fontSize: "0.7rem",
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {bar.total > 0 ? formatTokenCount(bar.total) : "0"}
                  </Typography>
                  <Box
                    className={`admin-chart-bar ${bar.height >= 90 ? "is-peak" : ""}`}
                    sx={{
                      height: bar.total > 0 ? `${bar.height}%` : 4,
                      width: "100%",
                      minHeight: bar.total > 0 ? 12 : 4,
                      opacity: bar.total > 0 ? 1 : 0.25,
                    }}
                    title={`${bar.label} (${formatDateVi(bar.date)}): ↑${formatTokenCount(bar.promptTokens)} ↓${formatTokenCount(bar.completionTokens)} · ${bar.requests} tin`}
                  />
                </Box>
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, px: 1 }}>
              {chartBars.map((bar) => (
                <Typography key={bar.date} variant="caption" sx={{ color: "var(--ac-outline)", flex: 1, textAlign: "center" }}>
                  {bar.label}
                </Typography>
              ))}
            </Box>

            <TableContainer sx={{ mt: 3 }}>
              <Table size="small" className="admin-activity-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell align="right">Tin gửi</TableCell>
                    <TableCell align="right">↑ Prompt</TableCell>
                    <TableCell align="right">↓ Completion</TableCell>
                    <TableCell align="right">Tổng token</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...(stats?.last7Days ?? [])].reverse().map((row) => {
                    const total = row.promptTokens + row.completionTokens;
                    return (
                      <TableRow key={row.date} hover>
                        <TableCell>
                          {formatDateVi(row.date)} ({formatDayLabel(row.date)})
                        </TableCell>
                        <TableCell align="right">{formatTokenCount(row.requestCount)}</TableCell>
                        <TableCell align="right">{formatTokenCount(row.promptTokens)}</TableCell>
                        <TableCell align="right">{formatTokenCount(row.completionTokens)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatTokenCount(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Mỗi lần chat: OpenRouter trả về <strong>prompt_tokens</strong> (đầu vào) và{" "}
          <strong>completion_tokens</strong> (câu trả lời) — lưu trên từng tin assistant trong DB. Tin cũ (trước khi
          bật ghi token khi stream) có thể hiển thị 0. Chi phí USD xem trên OpenRouter dashboard.
        </Typography>
      </Box>
    </Box>
  );
}
