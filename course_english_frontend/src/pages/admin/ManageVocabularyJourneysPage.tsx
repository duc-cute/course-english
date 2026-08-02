import AddIcon from "@mui/icons-material/Add";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Menu,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../admin/components";
import {
  apiCreateVocabularyJourney,
  apiDeleteVocabularyJourney,
  apiSearchVocabularyJourneys,
  type VocabularyJourneyRecord,
} from "../../shared/api/vocabularyJourney";
import type { ApiResponse } from "../../shared/api/types";
import { paths, studentRoutePaths } from "../../shared/constants/paths";
import {
  muDialogFooter,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muSelectAllowEmpty,
  muTextFieldSx,
} from "./manageUserUiStyles";

function unwrapRows(response: unknown): VocabularyJourneyRecord[] {
  const payload = response as ApiResponse<{ result?: VocabularyJourneyRecord[] }> & {
    result?: VocabularyJourneyRecord[];
    data?: { result?: VocabularyJourneyRecord[] };
  };
  const raw = payload?.data?.result ?? payload?.result;
  return Array.isArray(raw) ? raw : [];
}

/** Cover fallback khi chưa có coverImageUrl — sẽ chỉnh sau */
const getThemeClassAndIcon = (title: string) => {
  const cleanTitle = title.toLowerCase().trim();
  if (cleanTitle.includes("ocean") || cleanTitle.includes("đại dương") || cleanTitle.includes("biển")) {
    return { theme: "fallback-theme-ocean", icon: "🌊" };
  }
  if (cleanTitle.includes("forest") || cleanTitle.includes("rừng") || cleanTitle.includes("thiên nhiên")) {
    return { theme: "fallback-theme-forest", icon: "🌲" };
  }
  if (cleanTitle.includes("city") || cleanTitle.includes("thành phố") || cleanTitle.includes("đô thị")) {
    return { theme: "fallback-theme-city", icon: "🏙️" };
  }
  if (cleanTitle.includes("space") || cleanTitle.includes("vũ trụ") || cleanTitle.includes("không gian")) {
    return { theme: "fallback-theme-space", icon: "🚀" };
  }
  return { theme: "fallback-theme-default", icon: "✨" };
};

const formatJourneyDate = (row: VocabularyJourneyRecord) => {
  const dateStr = row.updatedAt || row.createdAt;
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return "—";
  }
};

export function ManageVocabularyJourneysPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VocabularyJourneyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<VocabularyJourneyRecord | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    row: VocabularyJourneyRecord;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page: 0, size: 50, sort: "displayOrder,asc" };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (status) params.status = status;
      const response = await apiSearchVocabularyJourneys(params);
      setRows(unwrapRows(response));
    } catch (err) {
      setRows([]);
      setError((err as { message?: string })?.message || "Không tải được danh sách journey.");
    } finally {
      setLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Nhập tên journey.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const created = await apiCreateVocabularyJourney({
        title: title.trim(),
        status: "DRAFT",
      });
      setOpenCreate(false);
      setTitle("");
      navigate(`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}/${created.id}`);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tạo được journey.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await apiDeleteVocabularyJourney(deleting.id);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không xóa được journey.");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === "newest") {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    }
    if (sortBy === "oldest") {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateA - dateB;
    }
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });

  const totalCount = rows.length;
  const publishedCount = rows.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = rows.filter((r) => r.status === "DRAFT").length;

  return (
    <Box className="vocab-journeys-container">
      <header className="journey-header">
        <div className="journey-header-left">
          <div className="journey-header-icon">
            <RouteOutlinedIcon />
          </div>
          <div>
            <Typography variant="h1" className="journey-header-title">
              Learning Journey
            </Typography>
            <Typography className="journey-header-subtitle">
              Tạo và quản lý các lộ trình học theo chủ đề.
            </Typography>
          </div>
        </div>
        <div className="journey-create-btn-wrapper">
          <svg className="decorator-arrow" width="60" height="50" viewBox="0 0 60 50" fill="none">
            <path
              d="M 5 45 C 10 25, 25 10, 52 18"
              stroke="#818cf8"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
            <path
              d="M 44 12 L 52 18 L 46 24"
              stroke="#818cf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <Button
            variant="contained"
            className="journey-create-btn"
            startIcon={<AddIcon />}
            onClick={() => {
              setTitle("");
              setOpenCreate(true);
            }}
          >
            Tạo journey mới
          </Button>

          <svg className="decorator-sparkles" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M 22 4 Q 22 14 32 14 Q 22 14 22 24 Q 22 14 12 14 Q 22 14 22 4 Z"
              fill="#818cf8"
            />
            <path
              d="M 10 24 Q 10 29 15 29 Q 10 29 10 34 Q 10 29 5 29 Q 10 29 10 24 Z"
              fill="#a5b4fc"
            />
          </svg>
        </div>
      </header>

      <section className="journey-stats-grid">
        <div className="journey-stat-card">
          <div className="journey-stat-icon-wrapper total">
            <RouteOutlinedIcon />
          </div>
          <div className="journey-stat-content">
            <span className="journey-stat-value">{totalCount}</span>
            <span className="journey-stat-title">Tổng journey</span>
            <span className="journey-stat-desc">Đã tạo</span>
          </div>
        </div>

        <div className="journey-stat-card">
          <div className="journey-stat-icon-wrapper published">
            <CheckCircleOutlineIcon />
          </div>
          <div className="journey-stat-content">
            <span className="journey-stat-value">{publishedCount}</span>
            <span className="journey-stat-title">Đã xuất bản</span>
            <span className="journey-stat-desc">Đang hoạt động</span>
          </div>
        </div>

        <div className="journey-stat-card">
          <div className="journey-stat-icon-wrapper draft">
            <AccessTimeIcon />
          </div>
          <div className="journey-stat-content">
            <span className="journey-stat-value">{draftCount}</span>
            <span className="journey-stat-title">Bản nháp</span>
            <span className="journey-stat-desc">Chưa xuất bản</span>
          </div>
        </div>
      </section>

      <Box className="journey-toolbar-card">
        <div className="journey-toolbar-row">
          <TextField
            size="small"
            className="journey-search-field"
            placeholder="Tìm kiếm journey..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setKeyword(searchInput);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "#94a3b8" }}>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <div className="journey-select-wrap">
            <TextField
              select
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              SelectProps={muSelectAllowEmpty}
              fullWidth
            >
              <MenuItem value="">Trạng thái: Tất cả</MenuItem>
              <MenuItem value="DRAFT">Trạng thái: Nháp</MenuItem>
              <MenuItem value="PUBLISHED">Trạng thái: Đã xuất bản</MenuItem>
              <MenuItem value="ARCHIVED">Trạng thái: Lưu trữ</MenuItem>
            </TextField>
          </div>

          <div className="journey-select-wrap">
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              fullWidth
            >
              <MenuItem value="newest">Sắp xếp: Mới nhất</MenuItem>
              <MenuItem value="oldest">Sắp xếp: Cũ nhất</MenuItem>
              <MenuItem value="displayOrder">Sắp xếp: Thứ tự hiển thị</MenuItem>
            </TextField>
          </div>

          <Button
            className="journey-filter-btn"
            startIcon={<SearchIcon />}
            onClick={() => setKeyword(searchInput)}
          >
            Tìm
          </Button>
        </div>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: "20px" }} />
          ))}
        </Box>
      ) : sortedRows.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: "12px" }}>
          Chưa có journey nào. Bấm “Tạo journey mới” để bắt đầu.
        </Alert>
      ) : (
        <div className="journey-list-wrap">
          {sortedRows.map((row) => {
            const themeInfo = getThemeClassAndIcon(row.title);
            const updateDate = formatJourneyDate(row);

            return (
              <div className="journey-item-card" key={row.id}>
                <div className="journey-cover-wrapper">
                  {row.coverImageUrl ? (
                    <img
                      src={row.coverImageUrl}
                      className="journey-cover-img"
                      alt={row.title}
                    />
                  ) : (
                    <div className={`journey-cover-fallback ${themeInfo.theme}`}>
                      <span className="journey-cover-fallback-icon">{themeInfo.icon}</span>
                    </div>
                  )}
                </div>

                <div className="journey-info-section">
                  <div className="journey-title-container">
                    <Typography className="journey-card-title">{row.title}</Typography>
                    <span className={`journey-badge ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </div>

                  <Typography className="journey-card-desc">
                    {row.description ||
                      `Khám phá lộ trình học từ vựng chủ đề ${row.title} với các bài học thiết kế sinh động.`}
                  </Typography>

                  <div className="journey-card-meta-row">
                    <div className="journey-meta-bubble">
                      <MenuBookOutlinedIcon className="journey-meta-icon" />
                      <span>{row.topicCount ?? 0} topic</span>
                    </div>
                    <div className="journey-meta-bubble">
                      <SchoolOutlinedIcon className="journey-meta-icon" />
                      <span>{row.classroomCount ?? 0} lớp</span>
                    </div>
                    <div className="journey-meta-bubble">
                      <AccessTimeIcon className="journey-meta-icon" />
                      <span>Cập nhật: {updateDate}</span>
                    </div>
                  </div>
                </div>

                <div className="journey-actions-stack">
                  <Button
                    variant="outlined"
                    className="journey-action-btn view"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={() => navigate(studentRoutePaths.vocabJourney(row.id))}
                  >
                    Xem
                  </Button>
                  <Button
                    variant="outlined"
                    className="journey-action-btn edit"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() =>
                      navigate(`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}/${row.id}`)
                    }
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outlined"
                    className="journey-action-btn delete"
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    onClick={() => setDeleting(row)}
                  >
                    Xóa
                  </Button>
                </div>

                <IconButton
                  className="journey-card-dots"
                  onClick={(e) => setMenuAnchor({ element: e.currentTarget, row })}
                >
                  <MoreVertIcon />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              navigate(studentRoutePaths.vocabJourney(menuAnchor.row.id));
            }
            setMenuAnchor(null);
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
          Xem học sinh
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              navigate(
                `/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_JOURNEYS}/${menuAnchor.row.id}`,
              );
            }
            setMenuAnchor(null);
          }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
          Sửa chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              setDeleting(menuAnchor.row);
            }
            setMenuAnchor(null);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutlineOutlinedIcon fontSize="small" sx={{ mr: 1, color: "error.main" }} />
          Xóa journey
        </MenuItem>
      </Menu>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tạo Learning Journey</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Tên journey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 1, ...muTextFieldSx }}
          />
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenCreate(false)} sx={muFooterBtnOutlined}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void handleCreate()}
            sx={muFooterBtnPrimary}
          >
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa journey?"
        content={`Xóa "${deleting?.title ?? ""}"? Topics trong journey cũng sẽ bị ẩn.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleting(null)}
        loading={submitting}
      />
    </Box>
  );
}
