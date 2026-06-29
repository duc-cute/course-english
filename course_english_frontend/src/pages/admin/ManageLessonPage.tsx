import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
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
  LessonImageUpload,
  SubjectPagingAutocomplete,
  type CatalogGridColumn,
} from "../../admin/components";
import {
  datetimeLocalToIso,
  formatDueAtLabel,
  isoToDatetimeLocal,
} from "../../admin/components/teachingPlan/teachingPlanUtils";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muDialogPaper,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muRequired,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateLesson,
  apiDeleteLesson,
  apiGetLessonById,
  apiGetLessons,
  apiUpdateLesson,
  type LessonRecord,
  type LessonsPaginationResult,
} from "../../shared/api/lesson";
import { apiUploadFile, buildStoragePublicUrl } from "../../shared/api/file";
import type { SubjectRecord } from "../../shared/api/subject";
import type { ApiResponse } from "../../shared/api/types";
import { paths } from "../../shared/constants/paths";

type LessonForm = {
  title: string;
  summary: string;
  coverImageUrl: string;
  displayOrder: number;
  dueAtLocal: string;
  subject: SubjectRecord | null;
};

const defaultForm: LessonForm = {
  title: "",
  summary: "",
  coverImageUrl: "",
  displayOrder: 0,
  dueAtLocal: "",
  subject: null,
};

function statusChip(status?: string) {
  if (status === "PUBLISHED") {
    return <Chip size="small" label="Đã publish" color="success" variant="outlined" />;
  }
  return <Chip size="small" label="Nháp" variant="outlined" />;
}

export function ManageLessonPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LessonRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterSubject, setFilterSubject] = useState<SubjectRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<LessonRecord | null>(null);
  const [form, setForm] = useState<LessonForm>(defaultForm);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<LessonRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "displayOrder,asc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      if (filterSubject?.id) params.subjectId = filterSubject.id;
      const response = (await apiGetLessons(params)) as ApiResponse<LessonsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách bài học.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText, filterSubject?.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setOpenForm(true);
  };

  const openEditHeader = async (item: LessonRecord) => {
    setEditing(item);
    setOpenForm(true);
    setFormError("");
    try {
      const response = (await apiGetLessonById(item.id)) as ApiResponse<LessonRecord>;
      const detail = response?.result ?? response?.data ?? item;
      setForm({
        title: detail?.title ?? "",
        summary: detail?.summary ?? "",
        coverImageUrl: detail?.coverImageUrl ?? "",
        displayOrder: Number(detail?.displayOrder ?? 0),
        dueAtLocal: isoToDatetimeLocal(detail?.dueAt),
        subject: detail?.subjectId
          ? ({ id: detail.subjectId, name: detail.subjectName || "Môn học" } as SubjectRecord)
          : null,
      });
    } catch {
      setForm({
        title: item.title ?? "",
        summary: item.summary ?? "",
        coverImageUrl: item.coverImageUrl ?? "",
        displayOrder: Number(item.displayOrder ?? 0),
        dueAtLocal: isoToDatetimeLocal(item.dueAt),
        subject: item.subjectId
          ? ({ id: item.subjectId, name: item.subjectName || "Môn học" } as SubjectRecord)
          : null,
      });
    }
  };

  const uploadCoverImage = async (file: File) => {
    setUploadingCover(true);
    setFormError("");
    try {
      const folder = editing?.id ? `lessons/${editing.id}/cover` : "lessons/covers";
      const uploaded = await apiUploadFile(file, folder);
      const url = buildStoragePublicUrl(folder, uploaded.fileName);
      setForm((prev) => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Upload ảnh bìa thất bại.");
    } finally {
      setUploadingCover(false);
    }
  };

  const submitForm = async () => {
    const title = form.title.trim();
    if (!title || !form.subject?.id) {
      setFormError("Tiêu đề và môn học là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        title,
        summary: form.summary.trim(),
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
        dueAt: form.dueAtLocal ? datetimeLocalToIso(form.dueAtLocal) : null,
        subjectId: form.subject.id,
      };
      if (editing?.id) {
        await apiUpdateLesson(editing.id, payload);
        setOpenForm(false);
        await fetchData();
      } else {
        const created = (await apiCreateLesson(payload)) as ApiResponse<LessonRecord>;
        const lesson = created?.result ?? created?.data;
        setOpenForm(false);
        if (lesson?.id) {
          navigate(`/${paths.ADMIN}/manage-lesson/${lesson.id}/edit`);
          return;
        }
        await fetchData();
      }
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteLesson(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  const goEditor = (id: string) => {
    navigate(`/${paths.ADMIN}/manage-lesson/${id}/edit`);
  };

  const lessonColumns = useMemo<CatalogGridColumn<LessonRecord>[]>(
    () => [
      {
        key: "stt",
        header: "STT",
        width: "56px",
        mobileRole: "hidden",
        className: "catalog-table-muted",
        render: (_item, index) => page * size + index + 1,
      },
      {
        key: "title",
        header: "Tiêu đề",
        width: "minmax(160px, 1fr)",
        mobileRole: "title",
        render: (item) => item.title || "—",
      },
      {
        key: "subject",
        header: "Môn",
        width: "minmax(120px, 1fr)",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (item) => item.subjectName || "—",
      },
      {
        key: "dueAt",
        header: "Hạn nộp",
        width: "minmax(100px, 1fr)",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (item) => formatDueAtLabel(item.dueAt),
      },
      {
        key: "blocks",
        header: "Block",
        width: "56px",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (item) => item.blockCount ?? 0,
      },
      {
        key: "status",
        header: "TT",
        width: "72px",
        mobileRole: "inline",
        render: (item) => statusChip(item.status),
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "140px",
        align: "center",
        mobileRole: "actions",
        render: (item) => (
          <>
            <Tooltip title="Soạn block">
              <IconButton size="small" color="primary" onClick={() => goEditor(item.id)}>
                <ArticleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sửa thông tin">
              <IconButton size="small" onClick={() => void openEditHeader(item)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setDeleting(item);
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
    [page, size, navigate],
  );

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Quản lý bài học"
        subtitle="Danh sách bài học theo môn"
        icon={<MenuBookOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm theo tiêu đề/môn"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            setPage(0);
            setSearchText(searchInput);
          }}
          onReset={() => {
            setSearchInput("");
            setSearchText("");
            setFilterSubject(null);
            setPage(0);
          }}
          addLabel="Thêm bài"
          onAdd={openCreate}
          toolbarVariant="soft"
          extraFilters={
            <Box sx={{ minWidth: 160, maxWidth: 220, flex: "0 1 200px" }}>
              <SubjectPagingAutocomplete
                multiple={false}
                value={filterSubject}
                onChange={(val) => {
                  setFilterSubject((val as SubjectRecord | null) ?? null);
                  setPage(0);
                }}
                helperText=""
              />
            </Box>
          }
        />
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: 12 }}>{error}</Alert> : null}

      <Box className="admin-catalog-page__table-card">
        <AdminCatalogGridTable
          columns={lessonColumns}
          rows={rows}
          loading={loading}
          emptyText="Chưa có bài học. Tạo bài mới để soạn block nội dung."
          getRowKey={(item) => item.id}
        />
        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">
            Tổng: {total}
          </Typography>
          <Box className="admin-catalog-page__table-footer-controls">
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
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
            <TextField
              select
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              sx={{ width: 86, ...muTextFieldSx }}
            >
              {[10, 20, 50].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>

      <Dialog open={openForm} onClose={submitting ? undefined : () => setOpenForm(false)} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editing?.id ? "Cập nhật thông tin bài học" : "Tạo bài học mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label="Tiêu đề bài học"
              size="small"
              required
              sx={muTextFieldSx}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <TextField
              label="Tóm tắt"
              size="small"
              multiline
              minRows={2}
              sx={muTextFieldSx}
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
            />
            <LessonImageUpload
              label="Ảnh bìa bài học"
              imageUrl={form.coverImageUrl || undefined}
              uploading={uploadingCover}
              onFileSelected={uploadCoverImage}
            />
            <Box>
              <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                Môn học <Box component="span" sx={muRequired}>*</Box>
              </Typography>
              <SubjectPagingAutocomplete
                multiple={false}
                value={form.subject}
                onChange={(val) => setForm((p) => ({ ...p, subject: (val as SubjectRecord | null) ?? null }))}
              />
            </Box>
            <TextField
              label="Thứ tự trong môn"
              size="small"
              type="number"
              sx={muTextFieldSx}
              value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) || 0 }))}
            />
            <Box>
              <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                Hạn nộp (tùy chọn)
              </Typography>
              <TextField
                type="datetime-local"
                size="small"
                fullWidth
                sx={muTextFieldSx}
                value={form.dueAtLocal}
                onChange={(e) => setForm((p) => ({ ...p, dueAtLocal: e.target.value }))}
                helperText="Để trống nếu không theo dõi bài thiếu. Dùng cho Students Need Support."
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenForm(false)} sx={muFooterBtnOutlined} disabled={submitting}>
            Hủy
          </Button>
          <Button variant="contained" sx={muFooterBtnPrimary} onClick={() => void submitForm()} disabled={submitting || uploadingCover}>
            {editing?.id ? "Lưu" : "Tạo & soạn block"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa bài học"
        content={`Bạn có chắc muốn xóa bài "${deleting?.title || ""}"?`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => {
          if (!submitting) {
            setOpenDelete(false);
            setDeleting(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </Box>
  );
}
