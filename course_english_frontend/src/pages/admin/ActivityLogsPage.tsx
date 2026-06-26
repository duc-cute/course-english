import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { AdminCatalogPageHeader } from "../../admin/components";
import {
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muTextFieldSx,
  muSelectAllowEmpty,
  muSelectFilterInputLabelProps,
} from "./manageUserUiStyles";
import { apiSearchActivityLogs, type ActivityLogRecord } from "../../shared/api/activityLog";
import type { ApiResponse } from "../../shared/api/types";
import {
  ACTIVITY_LOG_ACTION_OPTIONS,
  ACTIVITY_LOG_MODULE_OPTIONS,
  ACTIVITY_LOG_SEVERITY_OPTIONS,
  activityLogActionLabel,
  activityLogSeverityLabel,
} from "../../shared/constants/activityLog";
import {
  extractActivityLogMetricFields,
  formatActivityLogMetrics,
} from "../../shared/activityLog/activityLogMetrics";

function formatOccurredAt(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function severityColor(severity?: string): "error" | "warning" | "info" | "default" {
  if (severity === "ERROR") return "error";
  if (severity === "WARN") return "warning";
  if (severity === "INFO") return "info";
  return "default";
}

function formatContextJson(raw?: string): string {
  if (!raw) return "—";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function ActivityLogsPage() {
  const [rows, setRows] = useState<ActivityLogRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [severity, setSeverity] = useState("");
  const [module, setModule] = useState("AI");
  const [action, setAction] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityLogRecord | null>(null);
  /** Tăng khi bấm Tìm để refetch dù bộ lọc không đổi so với lần trước. */
  const [searchNonce, setSearchNonce] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        page,
        size,
        sort: "occurredAt,desc",
      };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (severity) params.severity = severity;
      if (module) params.module = module;
      if (action) params.action = action;

      const response = (await apiSearchActivityLogs(params)) as ApiResponse<{
        result?: ActivityLogRecord[];
        meta?: { total?: number };
      }>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải nhật ký hệ thống.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, severity, module, action, searchNonce]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const applySearch = () => {
    setPage(0);
    setSearchText(searchInput);
    setSearchNonce((n) => n + 1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchText("");
    setSeverity("");
    setModule("AI");
    setAction("");
    setPage(0);
  };

  const openDetail = (row: ActivityLogRecord) => {
    setSelected(row);
    setDetailOpen(true);
  };

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Nhật ký hệ thống"
        subtitle="Theo dõi lỗi AI và sự kiện quan trọng — không cần mở log IDE."
        icon={<HistoryOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <div className="admin-catalog-toolbar admin-catalog-toolbar--soft">
          <div className="admin-catalog-toolbar__row">
            <TextField
              size="small"
              placeholder="Tìm theo nội dung / chi tiết"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="admin-catalog-toolbar__search"
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />,
              }}
            />
            <TextField
              select
              size="small"
              label="Mức độ"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(0);
              }}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 140 }}
            >
              {ACTIVITY_LOG_SEVERITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || "all"} value={opt.value}>
                  {opt.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Module"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(0);
              }}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 130 }}
            >
              {ACTIVITY_LOG_MODULE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || "all"} value={opt.value}>
                  {opt.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Hành động"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 200 }}
            >
              {ACTIVITY_LOG_ACTION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || "all"} value={opt.value}>
                  {opt.name}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" size="small" className="admin-catalog-toolbar__btn admin-catalog-toolbar__btn--primary" onClick={applySearch}>
              Tìm
            </Button>
            <Button variant="outlined" size="small" className="admin-catalog-toolbar__btn admin-catalog-toolbar__btn--outlined" onClick={resetFilters}>
              Làm mới
            </Button>
          </div>
        </div>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Mức độ</TableCell>
                <TableCell>Hành động</TableCell>
                <TableCell>Nội dung</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Số liệu</TableCell>
                <TableCell>Tham chiếu</TableCell>
                <TableCell align="right">Chi tiết</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={`sk-${idx}`}>
                      {Array.from({ length: 7 }).map((__, cellIdx) => (
                        <TableCell key={cellIdx}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box className="admin-catalog-page__empty">Chưa có bản ghi nhật ký.</Box>
                  </TableCell>
                </TableRow>
              ) : null}
              {!loading
                ? rows.map((row) => {
                    const metrics = formatActivityLogMetrics(row);
                    return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatOccurredAt(row.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={activityLogSeverityLabel(row.severity)}
                          color={severityColor(row.severity)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {activityLogActionLabel(row.action)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" noWrap title={row.message}>
                          {row.message || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        {metrics ? (
                          <Typography
                            variant="caption"
                            component="div"
                            sx={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.4 }}
                            title={metrics}
                          >
                            {metrics}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {row.refType ? `${row.refType}` : "—"}
                        {row.refId ? `\n${row.refId.slice(0, 8)}…` : ""}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" onClick={() => openDetail(row)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    );
                  })
                : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Số dòng"
        />
      </Box>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="body2">
                <strong>Thời gian:</strong> {formatOccurredAt(selected.occurredAt)}
              </Typography>
              <Typography variant="body2">
                <strong>Mức độ:</strong> {activityLogSeverityLabel(selected.severity)} ·{" "}
                <strong>Module:</strong> {selected.module || "—"} ·{" "}
                <strong>Hành động:</strong> {activityLogActionLabel(selected.action)}
              </Typography>
              <Typography variant="body2">
                <strong>Nội dung:</strong> {selected.message || "—"}
              </Typography>
              {selected.detail ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Chi tiết:</strong>
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      fontSize: 12,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selected.detail}
                  </Box>
                </Box>
              ) : null}
              {extractActivityLogMetricFields(selected).length > 0 ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Số liệu prompt / token:</strong>
                  </Typography>
                  <Box
                    component="table"
                    sx={{
                      width: "100%",
                      fontSize: 12,
                      borderCollapse: "collapse",
                      "& td": { py: 0.25, pr: 2, verticalAlign: "top" },
                      "& td:first-of-type": { color: "text.secondary", whiteSpace: "nowrap" },
                      "& td:last-of-type": { fontFamily: "monospace" },
                    }}
                  >
                    <tbody>
                      {extractActivityLogMetricFields(selected).map((field) => (
                        <tr key={field.label}>
                          <td>{field.label}</td>
                          <td>{field.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              ) : null}
              {selected.contextJson ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Context:</strong>
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      fontSize: 12,
                      overflow: "auto",
                    }}
                  >
                    {formatContextJson(selected.contextJson)}
                  </Box>
                </Box>
              ) : null}
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                userId: {selected.userId || "—"} · ref: {selected.refType || "—"}{" "}
                {selected.refId || ""}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button sx={muFooterBtnOutlined} onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
