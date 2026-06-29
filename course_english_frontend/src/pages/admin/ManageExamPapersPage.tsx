import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminCatalogGridTable,
  AdminCatalogPageHeader,
  AdminCatalogToolbar,
  ConfirmDialog,
  type CatalogGridColumn,
} from "../../admin/components";
import {
  muBtnSmOutlined,
  muPageShell,
  muSelectAllowEmpty,
  muSelectFilterInputLabelProps,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateExamPaper,
  apiDeleteExamPaper,
  apiSearchExamPapers,
  type ExamPaperRecord,
  type ExamPaperStatus,
  type ExamPapersPaginationResult,
} from "../../shared/api/examPaper";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";

function statusChip(status?: ExamPaperStatus) {
  if (status === "PUBLISHED") {
    return <Chip size="small" label="Published" color="success" variant="outlined" />;
  }
  if (status === "ARCHIVED") {
    return <Chip size="small" label="Lưu trữ" variant="outlined" />;
  }
  return <Chip size="small" label="Nháp" variant="outlined" />;
}

export function ManageExamPapersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ExamPaperRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<ExamPaperRecord | null>(null);

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

  const columns = useMemo<CatalogGridColumn<ExamPaperRecord>[]>(
    () => [
      {
        key: "stt",
        header: "#",
        width: "48px",
        mobileRole: "hidden",
        className: "catalog-table-muted",
        render: (_row, index) => page * size + index + 1,
      },
      {
        key: "title",
        header: "Tên đề",
        width: "minmax(180px, 2fr)",
        mobileRole: "title",
        render: (row) => row.title,
      },
      {
        key: "sections",
        header: "Phần / Câu",
        width: "120px",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (row) => `${row.sectionCount ?? 0} / ${row.questionCount ?? 0}`,
      },
      {
        key: "duration",
        header: "Thời gian",
        width: "90px",
        mobileRole: "hidden",
        render: (row) => (row.durationMinutes ? `${row.durationMinutes}′` : "—"),
      },
      {
        key: "status",
        header: "Trạng thái",
        width: "100px",
        mobileRole: "inline",
        render: (row) => statusChip(row.status),
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "100px",
        align: "center",
        mobileRole: "actions",
        render: (row) => (
          <>
            <Tooltip title="Soạn đề">
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  navigate(`/${paths.ADMIN}/${paths.EXAM_PAPER_EDITOR.replace(":examPaperId", row.id)}`)
                }
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setDeleting(row);
                  setOpenDelete(true);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [navigate, page, size],
  );

  return (
    <Box className="admin-catalog-page" sx={muPageShell}>
      <AdminCatalogPageHeader
        icon={<AssignmentOutlinedIcon />}
        title="Đề thi / Kiểm tra"
        subtitle="Soạn đề nhiều phần — tách khỏi bài tập luyện trong Lesson."
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm theo tên đề..."
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            setPage(0);
            setSearchText(searchInput);
          }}
          onReset={() => {
            setSearchInput("");
            setSearchText("");
            setFilterStatus("");
            setPage(0);
          }}
          addLabel={submitting ? "Đang tạo..." : "Tạo đề mới"}
          onAdd={() => void createNew()}
          toolbarVariant="soft"
          extraFilters={
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
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 148 }}
            >
              <MenuItem value="">Mọi trạng thái</MenuItem>
              <MenuItem value="DRAFT">Nháp</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="ARCHIVED">Lưu trữ</MenuItem>
            </TextField>
          }
        />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>
          {error}
        </Alert>
      ) : null}

      <Box className="admin-catalog-page__table-card">
        <AdminCatalogGridTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyText="Chưa có đề thi nào. Bấm Tạo đề mới để bắt đầu."
          getRowKey={(row) => row.id}
        />
        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">
            Tổng: {total}
          </Typography>
          <Box className="admin-catalog-page__table-footer-controls">
            <Button
              variant="outlined"
              sx={muBtnSmOutlined}
              size="small"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Trang trước
            </Button>
            <Button
              variant="outlined"
              sx={muBtnSmOutlined}
              size="small"
              disabled={(page + 1) * size >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </Box>
        </Box>
      </Box>

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
