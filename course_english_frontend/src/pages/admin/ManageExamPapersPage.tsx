import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Menu,
  InputAdornment,
  Select,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../admin/components";
import { ExamAssignToClassroomDialog } from "../../admin/components/exam/ExamAssignToClassroomDialog";
import { ExamAssignmentScoresDialog } from "../../admin/components/exam/ExamAssignmentScoresDialog";
import {
  apiCreateExamPaper,
  apiDeleteExamPaper,
  apiSearchExamPapers,
  type ExamPaperRecord,
  type ExamPapersPaginationResult,
} from "../../shared/api/examPaper";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";
import { muSelectAllowEmpty, muSelectFilterInputLabelProps } from "./manageUserUiStyles";

function formatExamDate(row: ExamPaperRecord) {
  const dateStr = row.updatedAt || row.createdAt;
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function getCardAccent(row: ExamPaperRecord, index: number) {
  const themes = [
    { bg: "#f3e8ff", color: "#7c3aed" },
    { bg: "#eef2ff", color: "#4f46e5" },
    { bg: "#dcfce7", color: "#16a34a" },
    { bg: "#fef3c7", color: "#d97706" },
  ];
  const hash = row.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
  return themes[hash % themes.length];
}

export function ManageExamPapersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ExamPaperRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<ExamPaperRecord | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ExamPaperRecord | null>(null);
  const [assignPaper, setAssignPaper] = useState<ExamPaperRecord | null>(null);
  const [scoresPaper, setScoresPaper] = useState<ExamPaperRecord | null>(null);
  const [toast, setToast] = useState("");

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: ExamPaperRecord) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "createdAt,desc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (filterStatus) params.status = filterStatus;

      const response = (await apiSearchExamPapers(params)) as ApiResponse<ExamPapersPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách đề thi.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, filterStatus]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const deleteRow = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteExamPaper(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa đề thi.");
    } finally {
      setSubmitting(false);
    }
  };

  const createNew = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = (await apiCreateExamPaper({
        title: "Đề thi mới",
        status: "DRAFT",
        passScorePercent: 80,
        sections: [],
      })) as ApiResponse<ExamPaperRecord>;
      const created = response?.result ?? response?.data;
      if (created?.id) {
        navigate(`/${paths.ADMIN}/${paths.EXAM_PAPER_EDITOR.replace(":examPaperId", created.id)}`);
      }
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tạo đề thi.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToEditor = (id: string) => {
    navigate(`/${paths.ADMIN}/${paths.EXAM_PAPER_EDITOR.replace(":examPaperId", id)}`);
  };

  const applySearch = () => {
    setPage(0);
    setSearchText(searchInput);
  };

  const publishedCount = rows.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = rows.filter((r) => r.status === "DRAFT").length;

  const totalPages = Math.ceil(total / size) || 0;
  const startRow = total === 0 ? 0 : page * size + 1;
  const endRow = Math.min((page + 1) * size, total);

  const pageButtons = useMemo(() => {
    const buttons: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) buttons.push(i);
    } else if (page <= 2) {
      buttons.push(0, 1, 2, "...", totalPages - 1);
    } else if (page >= totalPages - 3) {
      buttons.push(0, "...", totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      buttons.push(0, "...", page, "...", totalPages - 1);
    }
    return buttons;
  }, [totalPages, page]);

  return (
    <Box className="exam-papers-container">
      <Box className="exam-header">
        <Box className="exam-header-left">
          <Box className="exam-header-icon">
            <AssignmentOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h1" className="exam-header-title">
              Đề thi / Kiểm tra
            </Typography>
            <Typography variant="body2" className="exam-header-subtitle">
              Soạn đề nhiều phần — tách khỏi bài tập luyện trong Lesson.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          className="exam-create-btn"
          onClick={() => void createNew()}
          disabled={submitting}
          startIcon={<AddIcon />}
        >
          {submitting ? "Đang tạo..." : "Tạo đề thi mới"}
        </Button>
      </Box>

      <Box className="exam-stats-grid">
        <Box className="exam-stat-card">
          <Box className="exam-stat-icon-wrapper total">
            <AssignmentOutlinedIcon />
          </Box>
          <Box className="exam-stat-content">
            <Typography className="exam-stat-value">{total}</Typography>
            <Typography className="exam-stat-title">Tổng đề thi</Typography>
          </Box>
        </Box>

        <Box className="exam-stat-card">
          <Box className="exam-stat-icon-wrapper published">
            <CheckCircleOutlinedIcon />
          </Box>
          <Box className="exam-stat-content">
            <Typography className="exam-stat-value">{publishedCount}</Typography>
            <Typography className="exam-stat-title">Đã xuất bản</Typography>
            <Typography className="exam-stat-desc">Trên trang này</Typography>
          </Box>
        </Box>

        <Box className="exam-stat-card">
          <Box className="exam-stat-icon-wrapper draft">
            <FeedOutlinedIcon />
          </Box>
          <Box className="exam-stat-content">
            <Typography className="exam-stat-value">{draftCount}</Typography>
            <Typography className="exam-stat-title">Nháp</Typography>
            <Typography className="exam-stat-desc">Trên trang này</Typography>
          </Box>
        </Box>
      </Box>

      <Box className="exam-toolbar-card">
        <Box className="exam-toolbar-row">
          <TextField
            placeholder="Tìm theo tên đề thi..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="exam-search-field"
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "text.secondary" }}>
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            label="Trạng thái"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
            SelectProps={muSelectAllowEmpty}
            InputLabelProps={muSelectFilterInputLabelProps}
            className="exam-select-wrap"
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="DRAFT">Nháp</MenuItem>
            <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
            <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            className="exam-filter-btn"
            startIcon={<SearchIcon fontSize="small" />}
            onClick={applySearch}
          >
            Tìm
          </Button>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {toast ? (
        <Alert severity="success" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setToast("")}>
          {toast}
        </Alert>
      ) : null}

      <Box className="exam-papers-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Box key={`skeleton-${idx}`} className="exam-skeleton-card">
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box className="exam-skeleton-pulse" sx={{ width: 48, height: 48, borderRadius: 3 }} />
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box className="exam-skeleton-pulse" sx={{ width: "80%", height: 16 }} />
                  <Box className="exam-skeleton-pulse" sx={{ width: "40%", height: 12 }} />
                </Box>
              </Box>
              <Box className="exam-skeleton-pulse" sx={{ width: "100%", height: 1, my: 1 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, my: 1 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box className="exam-skeleton-pulse" sx={{ width: "60%", height: 12 }} />
                    <Box className="exam-skeleton-pulse" sx={{ width: "40%", height: 8 }} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))
        ) : rows.length === 0 ? (
          <Box className="exam-empty-state">
            Chưa có đề thi nào khớp bộ lọc. Bấm “Tạo đề thi mới” để bắt đầu.
          </Box>
        ) : (
          rows.map((row, index) => {
            const accent = getCardAccent(row, index);
            return (
              <Box key={row.id} className="exam-paper-card">
                <Box className="exam-card-header">
                  <Box
                    className="exam-card-icon-box"
                    sx={{ backgroundColor: accent.bg, color: accent.color }}
                  >
                    <AssignmentOutlinedIcon />
                  </Box>
                  <Box className="exam-card-title-box">
                    <Typography className="exam-card-title">{row.title}</Typography>
                    <Box className="exam-card-chips">
                      {row.subjectName ? (
                        <Chip label={row.subjectName} size="small" className="exam-chip subject" />
                      ) : null}
                    </Box>
                  </Box>
                </Box>

                <Typography className="exam-card-meta">Cập nhật {formatExamDate(row)}</Typography>

                <Box className="exam-card-stats-grid">
                  <Box className="exam-card-stat-item">
                    <AssignmentOutlinedIcon className="exam-card-stat-icon" />
                    <Box className="exam-card-stat-info">
                      <Typography className="exam-card-stat-val">{row.questionCount ?? 0}</Typography>
                      <Typography className="exam-card-stat-lbl">Câu hỏi</Typography>
                    </Box>
                  </Box>

                  <Box className="exam-card-stat-item">
                    <MenuBookOutlinedIcon className="exam-card-stat-icon" />
                    <Box className="exam-card-stat-info">
                      <Typography className="exam-card-stat-val">{row.sectionCount ?? 0}</Typography>
                      <Typography className="exam-card-stat-lbl">Phần</Typography>
                    </Box>
                  </Box>

                  <Box className="exam-card-stat-item">
                    <AccessTimeOutlinedIcon className="exam-card-stat-icon" />
                    <Box className="exam-card-stat-info">
                      <Typography className="exam-card-stat-val">
                        {row.durationMinutes ? `${row.durationMinutes} phút` : "—"}
                      </Typography>
                      <Typography className="exam-card-stat-lbl">Thời gian</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box className="exam-card-footer">
                  {row.status === "PUBLISHED" ? (
                    <Chip label="Đã xuất bản" size="small" className="exam-status-badge published" />
                  ) : row.status === "ARCHIVED" ? (
                    <Chip label="Lưu trữ" size="small" className="exam-status-badge archived" />
                  ) : (
                    <Chip label="Nháp" size="small" className="exam-status-badge draft" />
                  )}

                  <Box className="exam-card-actions">
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        variant="outlined"
                        size="small"
                        className="exam-action-btn-outlined"
                        onClick={() => goToEditor(row.id)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                        Chỉnh sửa
                      </Button>
                    </Tooltip>

                    <IconButton
                      size="small"
                      className="exam-action-dots-btn"
                      onClick={(e) => handleMenuOpen(e, row)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      <Box className="exam-pagination-row">
        <Typography className="exam-pagination-text">
          Hiển thị {startRow} đến {endRow} trong tổng số {total} đề thi
        </Typography>

        <Box className="exam-pagination-controls">
          <IconButton
            size="small"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="exam-pagination-arrow-btn"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          {pageButtons.map((btn, idx) => {
            if (typeof btn === "string") {
              return (
                <Box key={`dots-${idx}`} sx={{ px: 1, color: "text.secondary", fontSize: 13 }}>
                  ...
                </Box>
              );
            }
            return (
              <Button
                key={`page-${btn}`}
                disabled={loading}
                className={`exam-pagination-btn ${page === btn ? "active" : ""}`}
                onClick={() => setPage(btn)}
              >
                {btn + 1}
              </Button>
            );
          })}

          <IconButton
            size="small"
            disabled={(page + 1) * size >= total || loading}
            onClick={() => setPage((p) => p + 1)}
            className="exam-pagination-arrow-btn"
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>

          <Select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            size="small"
            className="exam-pagination-size-select"
            sx={{
              height: 32,
              fontSize: 12,
              borderRadius: "8px",
              width: 105,
              backgroundColor: "#ffffff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
            }}
          >
            <MenuItem value={9}>9 / trang</MenuItem>
            <MenuItem value={12}>12 / trang</MenuItem>
            <MenuItem value={24}>24 / trang</MenuItem>
          </Select>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuRow) goToEditor(menuRow.id);
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: 13, py: 1 }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Chỉnh sửa đề
        </MenuItem>
        <MenuItem
          disabled={menuRow?.status !== "PUBLISHED"}
          onClick={() => {
            if (menuRow) setAssignPaper(menuRow);
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: 13, py: 1 }}
        >
          <GroupAddOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Gán cho lớp
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRow) setScoresPaper(menuRow);
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: 13, py: 1 }}
        >
          <LeaderboardOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Gán / điểm lớp
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRow) {
              setDeleting(menuRow);
              setOpenDelete(true);
            }
            handleMenuClose();
          }}
          sx={{ gap: 1, fontSize: 13, py: 1, color: "error.main" }}
        >
          <DeleteOutlineIcon fontSize="small" />
          Xóa đề thi
        </MenuItem>
      </Menu>

      <ExamAssignToClassroomDialog
        open={Boolean(assignPaper)}
        paper={assignPaper}
        onClose={() => setAssignPaper(null)}
        onSuccess={(msg) => setToast(msg)}
      />

      <ExamAssignmentScoresDialog
        open={Boolean(scoresPaper)}
        paper={scoresPaper}
        onClose={() => setScoresPaper(null)}
        onAssignClick={() => {
          if (scoresPaper) {
            setAssignPaper(scoresPaper);
            setScoresPaper(null);
          }
        }}
        onMessage={(msg) => setToast(msg)}
      />

      <ConfirmDialog
        open={openDelete}
        title="Xóa đề thi?"
        content={`Xóa "${deleting?.title ?? ""}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={() => setOpenDelete(false)}
        onConfirm={() => void deleteRow()}
        loading={submitting}
      />
    </Box>
  );
}
