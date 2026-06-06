import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { AdminCatalogToolbar, ClassroomPagingAutocomplete, ConfirmDialog } from "../../admin/components";
import {
  muBtnSmOutlined,
  muCatalogTableShell,
  muDialogFooter,
  muDialogPaper,
  muEmptyState,
  muFieldLabel,
  muFooterBtnOutlined,
  muFooterBtnPrimary,
  muPageShell,
  muPageTitle,
  muRequired,
  muTextFieldSx,
} from "./manageUserUiStyles";
import { apiGetClassroomById, type ClassroomRecord } from "../../shared/api/classroom";
import {
  apiCreateSubject,
  apiDeleteSubject,
  apiGetSubjectById,
  apiGetSubjects,
  apiUpdateSubject,
  type SubjectRecord,
  type SubjectsPaginationResult,
} from "../../shared/api/subject";
import type { ApiResponse } from "../../shared/api/types";

type SubjectForm = { name: string; displayOrder: number; classroom: ClassroomRecord | null };
const defaultForm: SubjectForm = { name: "", displayOrder: 0, classroom: null };

export function ManageSubjectPage() {
  const [rows, setRows] = useState<SubjectRecord[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState<SubjectForm>(defaultForm);
  const [formError, setFormError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<SubjectRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size, sort: "displayOrder,asc" };
      const trimmed = searchText.trim();
      if (trimmed) params.keyword = trimmed;
      const response = (await apiGetSubjects(params)) as ApiResponse<SubjectsPaginationResult>;
      const items = response?.data?.result ?? response?.result ?? [];
      const totalItems = response?.meta?.total ?? response?.data?.meta?.total ?? 0;
      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(totalItems) ? Number(totalItems) : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể tải danh sách môn học.");
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

  const openEdit = async (item: SubjectRecord) => {
    setEditing(item);
    setOpenForm(true);
    setFormError("");
    try {
      const response = (await apiGetSubjectById(item.id)) as ApiResponse<SubjectRecord>;
      const detail = response?.result ?? response?.data ?? item;
      let classroom: ClassroomRecord | null = null;
      if (detail?.classroomId) {
        try {
          const clsRes = (await apiGetClassroomById(detail.classroomId)) as ApiResponse<ClassroomRecord>;
          classroom = (clsRes?.result ?? clsRes?.data ?? null) as ClassroomRecord | null;
        } catch {
          classroom = detail.classroomId
            ? ({ id: detail.classroomId, name: detail.classroomName || "Lớp học", code: "" } as ClassroomRecord)
            : null;
        }
      }
      setForm({
        name: detail?.name ?? "",
        displayOrder: Number(detail?.displayOrder ?? 0),
        classroom,
      });
    } catch {
      setForm({
        name: item.name ?? "",
        displayOrder: Number(item.displayOrder ?? 0),
        classroom: item.classroomId
          ? ({ id: item.classroomId, name: item.classroomName || "Lớp học", code: "" } as ClassroomRecord)
          : null,
      });
    }
  };

  const submitForm = async () => {
    const name = form.name.trim();
    if (!name || !form.classroom?.id) {
      setFormError("Tên môn và lớp học là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name,
        displayOrder: Number(form.displayOrder) || 0,
        classroomId: form.classroom.id,
      };
      if (editing?.id) await apiUpdateSubject(editing.id, payload);
      else await apiCreateSubject(payload);
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      await fetchData();
    } catch (err) {
      setFormError((err as { message?: string })?.message || "Không thể lưu môn học.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setSubmitting(true);
    try {
      await apiDeleteSubject(deleting.id);
      setOpenDelete(false);
      setDeleting(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await fetchData();
    } catch (err) {
      setError((err as { message?: string })?.message || "Không thể xóa môn học.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={muPageShell}>
      <Typography variant="h5" sx={muPageTitle}>Quản lý môn học</Typography>

      <AdminCatalogToolbar
        searchPlaceholder="Tìm theo tên môn/lớp"
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
        addLabel="Thêm môn"
        onAdd={openCreate}
        importType="subjects"
        onImported={() => void fetchData()}
      />

      {error ? <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: 12 }}>{error}</Alert> : null}

      <Box sx={muCatalogTableShell}>
        <Box sx={{ px: 1.25, py: 0.75, borderBottom: "1px solid #D3D1C7", display: "grid", gridTemplateColumns: "72px minmax(220px,1fr) minmax(220px,1fr) 90px 120px", columnGap: 1.5, fontSize: 12, fontWeight: 700, color: "#0C447C" }}>
          <Box>STT</Box><Box>Tên môn</Box><Box>Lớp học</Box><Box>Thứ tự</Box><Box sx={{ textAlign: "center" }}>Thao tác</Box>
        </Box>
        {loading ? (
          <Box sx={{ p: 2 }}><Skeleton height={36} /><Skeleton height={36} /><Skeleton height={36} /></Box>
        ) : rows.length === 0 ? (
          <Box sx={muEmptyState}>Không có dữ liệu môn học.</Box>
        ) : (
          rows.map((item, index) => (
            <Box key={item.id} sx={{ px: 1.25, py: 0.75, borderBottom: "1px solid #ECEAE3", display: "grid", gridTemplateColumns: "72px minmax(220px,1fr) minmax(220px,1fr) 90px 120px", columnGap: 1.5, alignItems: "center", fontSize: 13 }}>
              <Box sx={{ color: "#5F5E5A" }}>{page * size + index + 1}</Box>
              <Box sx={{ fontWeight: 600, color: "#0C447C" }}>{item.name || "—"}</Box>
              <Box sx={{ color: "#5F5E5A" }}>{item.classroomName || "—"}</Box>
              <Box sx={{ color: "#5F5E5A" }}>{item.displayOrder ?? 0}</Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                <Tooltip title="Sửa"><IconButton size="small" color="primary" onClick={() => void openEdit(item)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => { setDeleting(item); setOpenDelete(true); }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
              </Box>
            </Box>
          ))
        )}
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#F9F8F5", borderTop: "1px solid #D3D1C7", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#5F5E5A" }}>Tổng: {total}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Trang trước</Button>
            <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={(page + 1) * size >= total} onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
            <TextField select size="small" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} sx={{ width: 86, ...muTextFieldSx }}>
              {[10, 20, 50].map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Box>
        </Box>
      </Box>

      <Dialog open={openForm} onClose={submitting ? undefined : () => setOpenForm(false)} fullWidth maxWidth="sm" PaperProps={{ sx: muDialogPaper }}>
        <DialogTitle>{editing?.id ? "Cập nhật môn học" : "Thêm môn học mới"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "grid", rowGap: 1.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField label="Tên môn" size="small" required sx={muTextFieldSx} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Box>
              <Typography component="label" sx={{ ...muFieldLabel, mb: 0.5 }}>
                Lớp học <Box component="span" sx={muRequired}>*</Box>
              </Typography>
              <ClassroomPagingAutocomplete
                multiple={false}
                value={form.classroom}
                onChange={(val) => setForm((p) => ({ ...p, classroom: (val as ClassroomRecord | null) ?? null }))}
                helperText={form.classroom ? undefined : "Bấm ô này để mở danh sách lớp — cần tạo lớp ở menu Quản lý lớp học trước"}
              />
            </Box>
            <TextField
              label="Thứ tự hiển thị"
              size="small"
              type="number"
              sx={muTextFieldSx}
              value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) || 0 }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={muDialogFooter}>
          <Button onClick={() => setOpenForm(false)} sx={muFooterBtnOutlined} disabled={submitting}>Hủy</Button>
          <Button variant="contained" sx={muFooterBtnPrimary} onClick={() => void submitForm()} disabled={submitting}>{editing?.id ? "Lưu thay đổi" : "Tạo mới"}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        title="Xóa môn học"
        content={`Bạn có chắc chắn muốn xóa môn "${deleting?.name || ""}"?`}
        cancelText="Hủy"
        confirmText="Xóa"
        onClose={() => { if (!submitting) { setOpenDelete(false); setDeleting(null); } }}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </Box>
  );
}
