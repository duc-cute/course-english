import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import {
  Alert,
  Box,
  Button,
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
import {
  AdminCatalogGridTable,
  AdminCatalogPageHeader,
  AdminCatalogToolbar,
  ConfirmDialog,
  type CatalogGridColumn,
} from "../../admin/components";
import {
  muBtnSmOutlined,
  muDialogFooter,
  muDialogPaper,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muTextFieldSx,
} from "./manageUserUiStyles";
import {
  apiCreateClassroom,
  apiDeleteClassroom,
  apiGetClassroomById,
  apiGetClassrooms,
  apiUpdateClassroom,
  type ClassroomRecord,
  type ClassroomsPaginationResult,
} from "../../shared/api/classroom";
import type { ApiResponse } from "../../shared/api/types";

type ClassroomForm = { name: string; code: string; description: string };
const defaultForm: ClassroomForm = { name: "", code: "", description: "" };

export function ManageClassroomPage() {
  const [rows, setRows] = useState<ClassroomRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<ClassroomRecord | null>(null);
  const [form, setForm] = useState<ClassroomForm>(defaultForm);
  const [formError, setFormError] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<ClassroomRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "id,desc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiGetClassrooms(params)) as ApiResponse<ClassroomsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách lớp học.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchText]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setOpenForm(true);
  };

  const openEdit = async (item: ClassroomRecord) => {
    setEditing(item);
    setFormError("");
    setOpenForm(true);
    try {
      const response = (await apiGetClassroomById(item.id)) as ApiResponse<ClassroomRecord>;
      const detail = response?.result ?? response?.data ?? item;
      setForm({
        name: detail?.name ?? "",
        code: detail?.code ?? "",
        description: detail?.description ?? "",
      });
    } catch {
      setForm({
        name: item.name ?? "",
        code: item.code ?? "",
        description: item.description ?? "",
      });
    }
  };

  const submitForm = async () => {
    const name = form.name.trim();
    const code = form.code.trim();
    if (!name || !code) {
      setFormError("Tên lớp và mã lớp là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      if (editing?.id) {
        await apiUpdateClassroom(editing.id, { name, code, description: form.description.trim() || undefined });
      } else {
        await apiCreateClassroom({ name, code, description: form.description.trim() || undefined });
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu lớp học.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteClassroom(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa lớp học.");
    } finally {
      setSubmitting(false);
    }
  };

  const classroomColumns = useMemo<CatalogGridColumn<ClassroomRecord>[]>(
    () => [
      {
        key: "stt",
        header: "STT",
        width: "72px",
        mobileRole: "hidden",
        className: "catalog-table-muted",
        render: (_item, index) => page * size + index + 1,
      },
      {
        key: "name",
        header: "Tên lớp",
        width: "minmax(240px, 1fr)",
        mobileRole: "title",
        render: (item) => item.name || "—",
      },
      {
        key: "code",
        header: "Mã lớp",
        width: "140px",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (item) => item.code || "—",
      },
      {
        key: "description",
        header: "Mô tả",
        width: "1fr",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (item) => item.description || "—",
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "120px",
        align: "center",
        mobileRole: "actions",
        render: (item) => (
          <>
            <Tooltip title="Sửa">
              <IconButton size="small" color="primary" onClick={() => void openEdit(item)}>
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
    [page, size],
  );

  return (
    <Box className="admin-catalog-page">
      <AdminCatalogPageHeader
        title="Quản lý lớp học"
        subtitle="Tạo và quản lý danh sách lớp học"
        icon={<MeetingRoomOutlinedIcon />}
      />

      <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
        <AdminCatalogToolbar
          searchPlaceholder="Tìm theo tên/mã lớp"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            setPage(0);
            setSearchText(searchInput);
          }}
          onReset={() => {
            setSearchInput("");
            setSearchText("");
            setPage(0);
          }}
          addLabel="Thêm lớp"
          onAdd={openCreate}
          importType="classrooms"
          toolbarVariant="soft"
          onImported={() => void fetchData()}
        />
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: 12 }}>{error}</Alert> : null}

      <Box className="admin-catalog-page__table-card">
        <AdminCatalogGridTable
          columns={classroomColumns}
          rows={rows}
          loading={loading}
          emptyText="Không có dữ liệu lớp học."
          getRowKey={(item) => item.id}
        />
        <Box className="admin-catalog-page__table-footer">
          <Typography variant="body2" className="admin-catalog-page__table-footer-total">Tổng: {total}</Typography>
          <Box className="admin-catalog-page__table-footer-controls">
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Trang trước</Button>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={(page + 1) * size >= total} onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
            <TextField select size="small" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} sx={{ width: 86, ...muTextFieldSx }}>
              {[10, 20, 50].map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Box>
        </Box>
      </Box>

      <Dialog open={openForm} onClose={submitting ? undefined : () => setOpenForm(false)} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editing?.id ? "Cập nhật lớp học" : "Thêm lớp học mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField label="Tên lớp" size="small" required value={form.name} sx={muTextFieldSx} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Mã lớp" size="small" required value={form.code} sx={muTextFieldSx} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            <TextField label="Mô tả" size="small" multiline minRows={2} sx={muTextFieldSx} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenForm(false)} sx={muFooterBtnOutlined} disabled={submitting}>Hủy</Button>
          <Button variant="contained" sx={muFooterBtnPrimary} onClick={() => void submitForm()} disabled={submitting}>{editing?.id ? "Lưu thay đổi" : "Tạo mới"}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa lớp học"
        content={`Bạn có chắc chắn muốn xóa lớp "${deleting?.name || ""}"?`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => { if (!submitting) { setOpenDelete(false); setDeleting(null); } }}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </Box>
  );
}
